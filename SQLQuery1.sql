USE [testdb];
GO

SET NOCOUNT ON;
SET STATISTICS TIME ON;   

DECLARE @employee_id BIGINT = 710253;

WITH org AS (
    SELECT s.id, s.name, s.parent_id, CAST(0 AS INT) AS sub_level
    FROM dbo.subdivisions AS s
    LEFT JOIN dbo.subdivisions AS p ON p.id = s.parent_id
    WHERE p.id IS NULL
    UNION ALL
    SELECT s.id, s.name, s.parent_id, o.sub_level + 1
    FROM dbo.subdivisions AS s
    INNER JOIN org AS o ON s.parent_id = o.id
),
emp_sub AS (
    SELECT TOP (1) c.subdivision_id AS root_sub_id
    FROM dbo.collaborators AS c
    WHERE c.id = @employee_id
),
subtree AS (
    SELECT s.id, s.name, s.parent_id, CAST(0 AS INT) AS depth_from_emp
    FROM dbo.subdivisions AS s
    INNER JOIN emp_sub AS e ON s.id = e.root_sub_id
    UNION ALL
    SELECT ch.id, ch.name, ch.parent_id, st.depth_from_emp + 1
    FROM dbo.subdivisions AS ch
    INNER JOIN subtree AS st ON ch.parent_id = st.id
)
SELECT
    c.id,
    c.name,
    s.name AS sub_name,
    s.id   AS sub_id,
    o.sub_level,                                
    COUNT(*) OVER (PARTITION BY c.subdivision_id) AS colls_count
FROM subtree AS st
JOIN dbo.subdivisions AS s ON s.id = st.id
JOIN org AS o ON o.id = st.id
JOIN dbo.collaborators AS c ON c.subdivision_id = st.id
WHERE st.depth_from_emp >= 1                    
  AND s.id NOT IN (100055, 100059)              
  AND c.age < 40                                
ORDER BY o.sub_level ASC, s.id, c.id
OPTION (MAXRECURSION 32767);

SET STATISTICS TIME OFF;
