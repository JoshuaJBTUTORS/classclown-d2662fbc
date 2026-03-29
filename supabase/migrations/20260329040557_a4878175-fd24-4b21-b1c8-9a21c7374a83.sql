
-- Fix: 1-1 A-Level Chemistry (Daniel Alake, Mondays) from 20:00 to 18:00 UK (-2 hours)
UPDATE lessons
SET start_time = start_time - INTERVAL '2 hours',
    end_time = end_time - INTERVAL '2 hours'
WHERE id IN (
  '4847dd1c-24b9-420f-b822-e2eecb3d00d4',
  'f4eebcaa-ae45-4ce9-8d50-b562dbac595c',
  'f70488b6-fc11-4cb9-8076-3d4422dd82f0',
  'c431f0bb-1108-48e3-b3e5-45c77d3eb39b',
  'eeecb8d9-0bbc-422b-bb88-53718cc3fd81',
  'c58b547c-5cc4-4057-9f78-b4ea28cb0200',
  'd24aaec8-fd68-4f56-a4d6-8d88dda4b619',
  '5603474c-3d2b-448e-87da-e532f15075f1',
  '176c98ba-9b30-43ea-95bb-efbe058fb539',
  'c1c37371-99b7-4c86-bd5d-b9a486f73f1b',
  '4e1d4dce-a940-4872-a9e3-20b0e92afd3a',
  '9066773e-904d-41ee-a4aa-ac55a206b392'
);
