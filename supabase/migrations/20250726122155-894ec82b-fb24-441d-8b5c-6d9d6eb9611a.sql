INSERT INTO public.lesson_transcriptions (
  lesson_id,
  session_id,
  transcription_status,
  transcription_text,
  transcription_url,
  expires_at,
  created_at,
  updated_at
) VALUES (
  '4daab4fc-8a80-40d5-b699-97a1a2ac6a0b',
  'fake_session_gcse_biology_test',
  'available',
  'Transcript: GCSE Biology Session
Topic: Cells
Tutor: Iris West
Student: Wally West
Date: [Insert Date]
Duration: 1 hour

00:00 – 02:00
Iris: Hi Wally! How are you doing today?
Wally: I''m good, thanks. A bit tired, but ready to learn.
Iris: Great! Today we''re starting our topic on cells. Do you remember anything about cells from your previous lessons?
Wally: Umm, just that they''re the basic units of life?

02:01 – 10:00
Iris: Exactly! Let''s go over the difference between prokaryotic and eukaryotic cells.
Wally: Prokaryotic means... no nucleus, right?
Iris: Yes, well done! Prokaryotic cells, like bacteria, don''t have a nucleus. Their genetic material floats freely in the cytoplasm. Eukaryotic cells, like plant and animal cells, do have a nucleus.
Wally: Got it.

10:01 – 20:00
Iris: Let''s go through the main organelles of an animal cell. I''ll name them — you tell me their function.
Wally: Okay!
Iris: First one — nucleus.
Wally: It controls the cell, and it stores DNA.
Iris: Good! Next — mitochondria.
Wally: That''s where respiration happens.
Iris: Yes, it releases energy. Cytoplasm?
Wally: It''s the jelly where reactions take place.
Iris: Brilliant! You''re smashing it.

20:01 – 35:00
Iris: Now let''s compare animal and plant cells. Can you tell me a structure that plant cells have but animal cells don''t?
Wally: Cell wall?
Iris: Yes, and what does it do?
Wally: It supports the cell and keeps its shape.
Iris: Good. Any others?
Wally: Chloroplasts — they do photosynthesis. And... a permanent vacuole?
Iris: Excellent! The vacuole contains cell sap and helps keep the cell turgid.

35:01 – 45:00
Iris: Now let''s talk about specialised cells. Can you think of one example?
Wally: Red blood cells?
Iris: Perfect! What''s special about them?
Wally: They have no nucleus so they can carry more oxygen.
Iris: Exactly — and they contain haemoglobin. What about root hair cells?
Wally: They absorb water and minerals from the soil. They have a big surface area.
Iris: Great answer.

45:01 – 55:00
Iris: Quick review: What''s the difference between diffusion, osmosis, and active transport?
Wally: Diffusion is spreading out from high to low concentration. Osmosis is diffusion of water. Active transport goes from low to high and needs energy.
Iris: Spot on! You''re getting the hang of this.

55:01 – 60:00
Iris: Any parts you want to review?
Wally: Maybe the specialised cells again — I want to be more confident with those.
Iris: Sure! We''ll go over that again next time and add in microscopy and cell division. You did really well today!
Wally: Thanks, Iris! See you next time.',
  null,
  NOW() + INTERVAL '24 hours',
  NOW(),
  NOW()
);