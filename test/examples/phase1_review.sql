-- Phase 1 review: expression operators, search conditions, WHERE/HAVING

-- Basic arithmetic
SELECT a + b, a - b, a * b, a / b, a % b

-- Operator precedence: multiply before add
SELECT a + b * c

-- Unary operators
SELECT -x, +y, ~flags

-- Parenthesized expressions
SELECT (a + b) * c
SELECT ((1 + 2))

-- Bitwise
SELECT flags & 0x0F, flags | 0x10, a ^ b

-- CASE simple
SELECT CASE status WHEN 1 THEN 'Active' WHEN 2 THEN 'Inactive' ELSE 'Unknown' END

-- CASE searched
SELECT CASE WHEN age >= 18 THEN 'Adult' WHEN age >= 13 THEN 'Teen' ELSE 'Child' END

-- WHERE with comparison
SELECT id, name FROM users WHERE id = 42

-- WHERE with AND / OR / NOT
SELECT * FROM orders WHERE status = 'open' AND total > 100
SELECT * FROM orders WHERE status = 'open' OR status = 'pending'
SELECT * FROM orders WHERE NOT status = 'cancelled'

-- BETWEEN
SELECT * FROM products WHERE price BETWEEN 10 AND 50
SELECT * FROM products WHERE price NOT BETWEEN 10 AND 50

-- IN list and subquery
SELECT * FROM users WHERE role IN ('admin', 'editor', 'viewer')
SELECT * FROM users WHERE id IN (SELECT user_id FROM admins)

-- LIKE
SELECT * FROM users WHERE name LIKE '%smith%'

-- IS NULL / IS NOT NULL
SELECT * FROM users WHERE email IS NULL
SELECT * FROM users WHERE email IS NOT NULL

-- EXISTS
SELECT * FROM departments WHERE EXISTS (SELECT 1 FROM employees WHERE employees.dept_id = departments.id)

-- HAVING
SELECT department, COUNT(*) FROM employees GROUP BY department HAVING COUNT(*) > 5

-- Subquery as expression
SELECT (SELECT MAX(salary) FROM employees)

-- Nested conditions
SELECT * FROM t WHERE (a = 1 OR b = 2) AND c = 3
