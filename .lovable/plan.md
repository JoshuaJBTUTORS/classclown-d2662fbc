

# Improve Homework Assignment Dialog

## Overview

Make all form fields compulsory and add a new "Additional Extract Required" field that lets tutors specify any additional documents or PDFs students need to complete alongside the homework.

## Changes Summary

### 1. Make All Fields Compulsory

Currently, only **Title** and **Lesson** are required. The following fields will become mandatory:
- **Title** (already required)
- **Instructions** (currently optional) - will show validation error if empty
- **Due Date** (currently optional) - will show validation error if not selected
- **Attachment** (currently optional) - will require a file upload for new homework (when editing, existing attachment satisfies the requirement)

### 2. Add "Additional Extract Required" Field

A new text area field that captures any additional documents, PDFs, or resources students need. For example: "Download the past paper from the exam board website" or "Use the textbook chapter 5 exercises".

This requires:
- A new `additional_resources` column in the `homework` database table
- A new text area field in the form UI

## Technical Details

### Database Migration
Add a new nullable column to the `homework` table:
- Column: `additional_resources` (text, nullable for backward compatibility with existing records)

### Form Schema Update (`AssignHomeworkDialog.tsx`)
Update the Zod validation schema:

```text
title: required (no change)
description: required (change from optional to required, min 2 chars)
lesson_id: required (no change)
due_date: required (change from optional to required)
attachment: required for new homework, optional when editing (with existing file)
additional_resources: required (new field, min 2 chars)
```

### Form UI Updates (`AssignHomeworkDialog.tsx`)
- Remove "(Optional)" labels from Due Date and Attachment fields
- Add red asterisk or "Required" indicator to all fields
- Add new "Additional Extract Required" text area field after the attachment field
- Update placeholder text to guide tutors on what to enter
- For the attachment field when editing: show that existing attachment satisfies the requirement

### Data Flow Update
- Include `additional_resources` in the homework data object sent to the database on save
- Pass `additional_resources` through to the `editingHomework` prop so it pre-fills when editing

### Interface Update
- Update the `editingHomework` interface to include `additional_resources`

### Files Modified
1. **`src/components/homework/AssignHomeworkDialog.tsx`** - Schema, form fields, submit handler, interface
2. **Database** - New `additional_resources` column on `homework` table

No changes needed to the edge function or notification logic -- the new field is for tutor reference within the platform.

