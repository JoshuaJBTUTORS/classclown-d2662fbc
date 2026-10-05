# Project rules

- Assessment "Refresh" must never rewrite a paper in place: it clones it (new `ai_assessments` row plus new `assessment_questions` rows), archives the original, and copies the assignments onto the clone. Why: marked work and submissions must stay attached to the exact version a student answered, so re-running a paper cannot destroy results.
