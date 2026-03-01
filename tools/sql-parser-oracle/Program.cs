using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using Microsoft.SqlServer.Management.SqlParser.Parser;
using Microsoft.SqlServer.Management.SqlParser.SqlCodeDom;

namespace sql_parser_oracle;

class Program
{
    static int Main(string[] args)
    {
        string sql;

        // Determine input mode
        bool treeMode = args.Contains("--tree");
        bool xmlMode = args.Contains("--xml");
        bool jsonMode = args.Contains("--json");
        bool quietMode = args.Contains("--quiet");
        bool helpMode = args.Contains("--help") || args.Contains("-h");

        if (helpMode)
        {
            PrintUsage();
            return 0;
        }

        // Get SQL input: from --sql argument, remaining args, or stdin
        int sqlArgIndex = Array.IndexOf(args, "--sql");
        if (sqlArgIndex >= 0 && sqlArgIndex + 1 < args.Length)
        {
            sql = args[sqlArgIndex + 1];
        }
        else
        {
            // Filter out flag arguments to see if there's a bare SQL string
            var nonFlagArgs = args.Where(a => !a.StartsWith("--")).ToArray();
            if (nonFlagArgs.Length > 0)
            {
                sql = string.Join(" ", nonFlagArgs);
            }
            else if (!Console.IsInputRedirected)
            {
                Console.Error.WriteLine("Enter T-SQL (press Ctrl+D when done):");
                sql = Console.In.ReadToEnd();
            }
            else
            {
                sql = Console.In.ReadToEnd();
            }
        }

        if (string.IsNullOrWhiteSpace(sql))
        {
            Console.Error.WriteLine("Error: No SQL input provided.");
            PrintUsage();
            return 1;
        }

        // Parse the SQL
        ParseResult result = Parser.Parse(sql);

        // Collect errors (non-warnings)
        var errors = result.Errors.Where(e => !e.IsWarning).ToList();
        var warnings = result.Errors.Where(e => e.IsWarning).ToList();

        // Report parse status
        bool success = errors.Count == 0;

        if (!quietMode)
        {
            Console.WriteLine("=== SQL Parser Oracle ===");
            Console.WriteLine($"Input length: {sql.Length} characters");
            Console.WriteLine($"Parse result: {(success ? "SUCCESS" : "FAILED")}");
            Console.WriteLine($"Batch count:  {result.BatchCount}");
            Console.WriteLine($"Errors:       {errors.Count}");
            Console.WriteLine($"Warnings:     {warnings.Count}");
            Console.WriteLine();
        }

        // Print errors
        if (errors.Count > 0)
        {
            Console.WriteLine("=== ERRORS ===");
            foreach (var error in errors)
            {
                Console.WriteLine($"  [{error.Start.LineNumber}:{error.Start.ColumnNumber}]-[{error.End.LineNumber}:{error.End.ColumnNumber}] {error.Message}");
            }
            Console.WriteLine();
        }

        // Print warnings
        if (warnings.Count > 0 && !quietMode)
        {
            Console.WriteLine("=== WARNINGS ===");
            foreach (var warning in warnings)
            {
                Console.WriteLine($"  [{warning.Start.LineNumber}:{warning.Start.ColumnNumber}]-[{warning.End.LineNumber}:{warning.End.ColumnNumber}] {warning.Message}");
            }
            Console.WriteLine();
        }

        // Print parse tree
        if (xmlMode)
        {
            Console.WriteLine("=== XML REPRESENTATION ===");
            Console.WriteLine(result.Script.Xml);
        }
        else if (jsonMode)
        {
            Console.WriteLine("=== JSON PARSE TREE ===");
            PrintJsonTree(result.Script, sql);
        }
        else if (treeMode || (!quietMode && success))
        {
            Console.WriteLine("=== PARSE TREE ===");
            PrintTree(result.Script, 0);
        }

        return success ? 0 : 1;
    }

    static void PrintUsage()
    {
        Console.Error.WriteLine(@"Usage: sql-parser-oracle [OPTIONS] [SQL]

Parses T-SQL statements using Microsoft.SqlServer.Management.SqlParser
and reports whether they parsed successfully, along with the parse tree.

Input:
  --sql ""<sql>""    Provide SQL as an argument
  <sql>            Bare SQL string (no -- prefix)
  (stdin)          Pipe SQL via stdin or type interactively

Output modes:
  --tree           Print indented parse tree (default on success)
  --xml            Print XML representation of the parse tree
  --json           Print JSON representation of the parse tree
  --quiet          Only print errors, suppress tree and info

Exit code:
  0                Parse succeeded (no errors)
  1                Parse failed or no input

Examples:
  echo ""SELECT 1"" | dotnet run
  dotnet run --sql ""SELECT * FROM dbo.Users WHERE Id = 1""
  dotnet run --xml --sql ""CREATE TABLE T1 (Id INT PRIMARY KEY)""
  dotnet run --json < myquery.sql");
    }

    /// <summary>
    /// Prints an indented tree of SqlCodeObject nodes.
    /// </summary>
    static void PrintTree(SqlCodeObject node, int depth)
    {
        string indent = new string(' ', depth * 2);
        string typeName = node.GetType().Name;

        // Build a concise representation
        string sqlSnippet = GetTruncatedSql(node, 80);
        string locationInfo = $"[{node.StartLocation.LineNumber}:{node.StartLocation.ColumnNumber}-{node.EndLocation.LineNumber}:{node.EndLocation.ColumnNumber}]";

        Console.WriteLine($"{indent}{typeName} {locationInfo} {sqlSnippet}");

        foreach (var child in node.Children)
        {
            PrintTree(child, depth + 1);
        }
    }

    /// <summary>
    /// Prints a JSON-like tree of SqlCodeObject nodes for machine consumption.
    /// </summary>
    static void PrintJsonTree(SqlCodeObject node, string fullSql)
    {
        PrintJsonNode(node, 0, fullSql, true);
        Console.WriteLine();
    }

    static void PrintJsonNode(SqlCodeObject node, int depth, string fullSql, bool isLast)
    {
        string indent = new string(' ', depth * 2);
        string typeName = node.GetType().Name;
        var children = node.Children.ToList();

        Console.WriteLine($"{indent}{{");
        Console.WriteLine($"{indent}  \"type\": \"{typeName}\",");
        Console.WriteLine($"{indent}  \"startLine\": {node.StartLocation.LineNumber},");
        Console.WriteLine($"{indent}  \"startColumn\": {node.StartLocation.ColumnNumber},");
        Console.WriteLine($"{indent}  \"endLine\": {node.EndLocation.LineNumber},");
        Console.WriteLine($"{indent}  \"endColumn\": {node.EndLocation.ColumnNumber},");
        Console.WriteLine($"{indent}  \"startOffset\": {node.StartLocation.Offset},");
        Console.WriteLine($"{indent}  \"endOffset\": {node.EndLocation.Offset},");

        // Include the SQL text for this node
        string sqlText = GetTruncatedSql(node, 200);
        Console.WriteLine($"{indent}  \"sql\": \"{EscapeJsonString(sqlText)}\",");

        Console.WriteLine($"{indent}  \"children\": [");
        for (int i = 0; i < children.Count; i++)
        {
            PrintJsonNode(children[i], depth + 2, fullSql, i == children.Count - 1);
        }
        Console.WriteLine($"{indent}  ]");

        Console.Write($"{indent}}}");
        if (!isLast)
            Console.Write(",");
        Console.WriteLine();
    }

    static string GetTruncatedSql(SqlCodeObject node, int maxLen)
    {
        try
        {
            string sql = node.Sql ?? "";
            // Replace newlines and multiple spaces for readability
            sql = sql.Replace("\r\n", " ").Replace("\n", " ").Replace("\r", " ");
            while (sql.Contains("  "))
                sql = sql.Replace("  ", " ");
            sql = sql.Trim();

            if (sql.Length > maxLen)
                sql = sql.Substring(0, maxLen) + "...";
            return sql;
        }
        catch
        {
            return "";
        }
    }

    static string EscapeJsonString(string s)
    {
        return s
            .Replace("\\", "\\\\")
            .Replace("\"", "\\\"")
            .Replace("\n", "\\n")
            .Replace("\r", "\\r")
            .Replace("\t", "\\t");
    }
}
