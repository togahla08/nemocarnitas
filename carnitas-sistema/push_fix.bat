-- Script to push the fix to remote
-- Run this on your machine:

-- 1. Navigate to the project
cd C:\Users\sines\Desktop\nemocarnitas

-- 2. Commit any pending changes
git add .
git commit -m "fix: remove invalid GENERATED ALWAYS AS syntax, use TRIGGER for totals"

-- 3. Push to remote
git push origin feature/nueva-funcionalidad