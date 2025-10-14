#!/bin/bash

# Clean up commit messages: lowercase first line and truncate to 60 chars

commit_msg=$(cat)

first_line=$(echo "$commit_msg" | head -n1)

# Make lowercase
first_line=$(echo "$first_line" | tr '[:upper:]' '[:lower:]')

# Truncate to 60 chars
first_line=${first_line:0:60}

# Output modified message
echo "$first_line"
echo "$commit_msg" | tail -n +2