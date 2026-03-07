using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Microsoft.SqlServer.TransactSql.ScriptDom;
using SmParser = Microsoft.SqlServer.Management.SqlParser.Parser;
using SmCommon = Microsoft.SqlServer.Management.SqlParser.Common;

namespace sql_parser_oracle;

class Program
{
    // ScriptDom versioned parsers (open-source, version-aware)
    static readonly (int version, string name, Func<TSqlParser> createParser)[] Versions =
    [
        (100, "SQL Server 2008",  () => new TSql100Parser(true)),
        (110, "SQL Server 2012",  () => new TSql110Parser(true)),
        (120, "SQL Server 2014",  () => new TSql120Parser(true)),
        (130, "SQL Server 2016",  () => new TSql130Parser(true)),
        (140, "SQL Server 2017",  () => new TSql140Parser(true)),
        (150, "SQL Server 2019",  () => new TSql150Parser(true)),
        (160, "SQL Server 2022",  () => new TSql160Parser(true)),
        (170, "SQL Server 2025",  () => new TSql170Parser(true)),
    ];

    const int DefaultVersion = 120; // SQL Server 2014

    static int Main(string[] args)
    {
        bool quietMode = args.Contains("--quiet");
        bool helpMode = args.Contains("--help") || args.Contains("-h");

        if (helpMode)
        {
            PrintUsage();
            return 0;
        }

        // Parse --version argument
        int targetVersion = DefaultVersion;
        int versionArgIndex = Array.IndexOf(args, "--version");
        if (versionArgIndex >= 0 && versionArgIndex + 1 < args.Length)
        {
            if (!int.TryParse(args[versionArgIndex + 1], out targetVersion))
            {
                Console.Error.WriteLine($"Error: Invalid version '{args[versionArgIndex + 1]}'.");
                Console.Error.WriteLine($"Valid versions: {string.Join(", ", Versions.Select(v => v.version))}");
                return 1;
            }
        }

        // Get SQL input
        string sql = GetSqlInput(args);
        if (string.IsNullOrWhiteSpace(sql))
        {
            Console.Error.WriteLine("Error: No SQL input provided.");
            PrintUsage();
            return 1;
        }

        // Find the target version entry
        var target = Versions.FirstOrDefault(v => v.version == targetVersion);
        if (target.createParser == null)
        {
            Console.Error.WriteLine($"Error: Unknown version {targetVersion}.");
            Console.Error.WriteLine($"Valid versions: {string.Join(", ", Versions.Select(v => v.version))}");
            return 1;
        }

        // --- Strategy ---
        // 1. Try ScriptDom at target version
        // 2. If fails, try ScriptDom at newer versions (reports min required version)
        // 3. If ScriptDom rejects at all versions, try SqlParser as fallback
        //    (SqlParser supports some syntax ScriptDom doesn't: EXTERNAL, FOR JSON, etc.)
        // 4. If both reject, it's truly invalid

        // Step 1: ScriptDom at target version
        var (sdSuccess, sdErrors) = TryScriptDom(target.createParser(), sql);
        if (sdSuccess)
        {
            if (!quietMode)
                Console.WriteLine($"OK ({target.name}, compat {target.version})");
            return 0;
        }

        // Step 2: ScriptDom at newer versions
        foreach (var v in Versions.Where(v => v.version > targetVersion))
        {
            var (ok, _) = TryScriptDom(v.createParser(), sql);
            if (ok)
            {
                Console.WriteLine($"FAIL at compat {targetVersion}, requires {v.name} (compat {v.version})");
                return 2; // Valid at newer version
            }
        }

        // Step 3: SqlParser fallback (covers FOR JSON, EXTERNAL, temporal, etc.)
        var smSuccess = TrySqlParser(sql);
        if (smSuccess)
        {
            if (!quietMode)
                Console.WriteLine($"OK (SqlParser fallback, compat 170)");
            return 0;
        }

        // Step 4: Both reject — truly invalid
        foreach (var error in sdErrors)
        {
            Console.WriteLine($"  [{error.Line}:{error.Column}] {error.Message}");
        }
        return 1;
    }

    static (bool success, IList<ParseError> errors) TryScriptDom(TSqlParser parser, string sql)
    {
        using var reader = new StringReader(sql);
        parser.Parse(reader, out IList<ParseError> errors);
        return (errors.Count == 0, errors);
    }

    static bool TrySqlParser(string sql)
    {
        var parseOptions = new SmParser.ParseOptions(
            batchSeparator: "GO",
            isQuotedIdentifierSet: true,
            compatibilityLevel: SmCommon.DatabaseCompatibilityLevel.Version170,
            transactSqlVersion: SmCommon.TransactSqlVersion.Version170
        );
        var result = SmParser.Parser.Parse(sql, parseOptions);
        var errors = result.Errors.Where(e => !e.IsWarning).ToList();
        return errors.Count == 0;
    }

    static string GetSqlInput(string[] args)
    {
        // --sql "..." mode
        int sqlArgIndex = Array.IndexOf(args, "--sql");
        if (sqlArgIndex >= 0 && sqlArgIndex + 1 < args.Length)
            return args[sqlArgIndex + 1];

        // Filter out flags and their values
        var skipNext = new HashSet<string> { "--version", "--sql" };
        var flags = new HashSet<string> { "--quiet", "--help", "-h" };
        var nonFlagArgs = new List<string>();
        for (int i = 0; i < args.Length; i++)
        {
            if (skipNext.Contains(args[i])) { i++; continue; }
            if (flags.Contains(args[i])) continue;
            nonFlagArgs.Add(args[i]);
        }

        if (nonFlagArgs.Count > 0)
            return string.Join(" ", nonFlagArgs);

        // stdin
        if (Console.IsInputRedirected)
            return Console.In.ReadToEnd();

        Console.Error.WriteLine("Enter T-SQL (press Ctrl+D when done):");
        return Console.In.ReadToEnd();
    }

    static void PrintUsage()
    {
        Console.Error.WriteLine(@"Usage: sql-parser-oracle [OPTIONS] [SQL]

Parses T-SQL using two Microsoft parsers for maximum coverage:
  1. ScriptDom (versioned, open-source) — tries target version, then newer
  2. SqlParser (latest, broader coverage) — fallback for syntax gaps

Input:
  --sql ""<sql>""        Provide SQL as an argument
  <sql>                Bare SQL string
  (stdin)              Pipe SQL via stdin

Options:
  --version <N>        ScriptDom compat level (default: 120 = SQL 2014)
                       Valid: 100, 110, 120, 130, 140, 150, 160, 170
  --quiet              Minimal output

Exit codes:
  0    Parse succeeded (ScriptDom at target version, or SqlParser fallback)
  1    Parse failed at all parsers (invalid SQL)
  2    ScriptDom failed at target but succeeded at a newer version

Examples:
  echo ""SELECT 1"" | sql-parser-oracle
  sql-parser-oracle --version 160 --sql ""CREATE DATABASE d1 ...""
  sql-parser-oracle --quiet < query.sql");
    }
}
