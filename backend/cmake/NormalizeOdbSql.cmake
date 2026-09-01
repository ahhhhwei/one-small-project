# ODB's MySQL backend quotes identifiers with backticks. The project's
# ShardingSphere proxy routes part of the SQL to openGauss, whose JDBC driver
# does not accept MySQL backticks. All identifiers in this schema are simple
# lower-case names, so removing the quotes is safe and keeps the generated ODB
# persistence implementation and its runtime query metadata usable for both
# physical database dialects.
file(READ "${INPUT_FILE}" generated_source)
string(REPLACE "`" "" normalized_source "${generated_source}")
file(WRITE "${INPUT_FILE}" "${normalized_source}")
