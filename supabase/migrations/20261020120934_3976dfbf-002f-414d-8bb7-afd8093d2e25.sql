INSERT INTO public.uk_schools (urn, name, town, postcode, local_authority, phase, establishment_type)
VALUES (99000001, 'St John''s Catholic Comprehensive School', 'Gravesend', 'DA12 2JW', 'Kent', 'Secondary', 'Manually added')
ON CONFLICT (urn) DO NOTHING;