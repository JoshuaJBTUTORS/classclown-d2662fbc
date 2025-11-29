
-- Update GCSE Biology lessons with missing/generic descriptions

-- Cell Biology
UPDATE course_lessons SET description = '✅ INCLUDE: Animal and plant cell structures, organelles (nucleus, cytoplasm, cell membrane, mitochondria, ribosomes, chloroplasts, vacuole, cell wall), comparing prokaryotic and eukaryotic cells
❌ EXCLUDE: Detailed biochemistry of organelles, electron transport chain details
🎯 FOCUS: Identifying and labelling cell structures, comparing animal vs plant vs bacterial cells, understanding organelle functions
📝 EXAM TIP: Learn the differences: plant cells have cell wall, chloroplasts, permanent vacuole; animal cells do not'
WHERE id = 'e56de480-36fa-4e3d-a16e-2602f7a6b76a';

UPDATE course_lessons SET description = '✅ INCLUDE: Cell specialisation, differentiation in animals and plants, stem cells (embryonic, adult, meristems), therapeutic uses of stem cells
❌ EXCLUDE: Detailed molecular mechanisms of differentiation, epigenetics
🎯 FOCUS: Examples of specialised cells (nerve, muscle, sperm, root hair, xylem, phloem), how structure relates to function
📝 EXAM TIP: For each specialised cell, explain how its structure helps it perform its function'
WHERE id = 'bbf5f18a-2d80-4555-99d6-4e2076e13de9';

UPDATE course_lessons SET description = '✅ INCLUDE: Diffusion, osmosis, active transport, surface area to volume ratio, exchange surfaces in organisms, factors affecting rate of diffusion
❌ EXCLUDE: Detailed membrane protein structures, electrochemical gradients
🎯 FOCUS: Definitions and examples of each transport method, practical investigations (osmosis in potato)
📝 EXAM TIP: Diffusion = passive, high to low. Osmosis = water through partially permeable membrane. Active transport = against gradient, needs energy'
WHERE id = 'b68b6ce4-dc1c-4285-895e-a2cc42a0c3ba';

-- Organisation
UPDATE course_lessons SET description = '✅ INCLUDE: Food tests (Benedict''s for sugars, iodine for starch, Biuret for protein, ethanol emulsion for lipids), using results tables
❌ EXCLUDE: Quantitative analysis, spectrophotometry
🎯 FOCUS: Required practical - food tests procedure, safety precautions, recording and interpreting results
📝 EXAM TIP: Know colour changes: Benedict''s blue→green→yellow→orange→red; Iodine yellow-brown→blue-black'
WHERE id = '51f42367-8780-4cf7-bc8e-361352114d81';

UPDATE course_lessons SET description = '✅ INCLUDE: Heart structure (4 chambers, valves, blood vessels), double circulatory system, lungs structure (alveoli, bronchi, trachea), gas exchange, breathing mechanism
❌ EXCLUDE: Detailed cardiac electrophysiology, respiratory volumes calculations
🎯 FOCUS: Blood flow through heart, how alveoli are adapted for gas exchange, ventilation mechanism
📝 EXAM TIP: Follow blood flow: body→vena cava→right atrium→right ventricle→pulmonary artery→lungs→pulmonary vein→left atrium→left ventricle→aorta→body'
WHERE id = 'e02c74d8-017c-40c4-9130-620dcecbfa54';

UPDATE course_lessons SET description = '✅ INCLUDE: Coronary heart disease, stents, statins, heart valves, artificial hearts, heart transplants, lifestyle factors
❌ EXCLUDE: Detailed pharmacology, surgical techniques
🎯 FOCUS: Causes of CHD (fatty deposits blocking coronary arteries), treatments and their advantages/disadvantages
📝 EXAM TIP: Compare treatments: stents (quick, foreign body risk) vs statins (daily, side effects) vs transplant (limited donors)'
WHERE id = '6224b56c-9568-450b-b238-f381df58cabe';

-- Infection and Response
UPDATE course_lessons SET description = '✅ INCLUDE: Pathogens (bacteria, viruses, fungi, protists), disease transmission, examples (measles, HIV, tobacco mosaic virus, rose black spot, malaria), body defences
❌ EXCLUDE: Detailed immunology, antibody structure
🎯 FOCUS: How each pathogen type causes disease, specific examples and their transmission, non-specific defences (skin, mucus, cilia)
📝 EXAM TIP: Know one example of each pathogen type and how it spreads'
WHERE id = '53a1adee-728f-45a7-864c-0e649fe0e211';

-- Bioenergetics
UPDATE course_lessons SET description = '✅ INCLUDE: Aerobic respiration equation, anaerobic respiration in animals and plants, comparing energy release, oxygen debt, fermentation
❌ EXCLUDE: Krebs cycle details, oxidative phosphorylation
🎯 FOCUS: Word and symbol equations, where respiration occurs, comparing aerobic vs anaerobic
📝 EXAM TIP: Aerobic: glucose + oxygen → carbon dioxide + water. Anaerobic (animals): glucose → lactic acid. Anaerobic (yeast): glucose → ethanol + CO₂'
WHERE id = 'bc52bea8-63fe-4af7-876d-887efaab0a89';

-- Homeostasis and Response
UPDATE course_lessons SET description = '✅ INCLUDE: Homeostasis definition, importance of internal environment, nervous system overview, hormonal system overview, feedback loops
❌ EXCLUDE: Detailed neurotransmitter chemistry, complex endocrine interactions
🎯 FOCUS: Definition and examples of homeostasis, comparing nervous and hormonal control, negative feedback
📝 EXAM TIP: Homeostasis = maintaining a constant internal environment. Give examples: temperature, blood glucose, water levels'
WHERE id = '3c8bb1be-0594-4439-951a-ea72988dce29';

UPDATE course_lessons SET description = '✅ INCLUDE: Kidney structure, filtration, reabsorption, osmoregulation, ADH, kidney failure treatments (dialysis, transplant)
❌ EXCLUDE: Detailed nephron physiology, dialysis machine mechanics
🎯 FOCUS: How kidneys filter blood and regulate water, role of ADH, comparing dialysis vs transplant
📝 EXAM TIP: ADH is released when water levels are LOW, makes collecting ducts MORE permeable so MORE water is reabsorbed'
WHERE id = '76ccbb66-f101-455b-8f69-0efc43b3df56';

UPDATE course_lessons SET description = '✅ INCLUDE: Hormonal control of puberty, menstrual cycle, fertility treatments (FSH, LH injections), contraception (hormonal and barrier methods), IVF
❌ EXCLUDE: Detailed hormone receptor mechanisms, assisted reproduction ethics beyond basic
🎯 FOCUS: Roles of FSH, LH, oestrogen, progesterone in menstrual cycle, how contraception works
📝 EXAM TIP: FSH = stimulates egg maturation, LH = triggers ovulation, oestrogen = repairs uterus lining, progesterone = maintains lining'
WHERE id = 'b68dc3b2-d3ce-40f7-a969-5ca2e534c047';

-- Inheritance, Variation and Evolution
UPDATE course_lessons SET description = '✅ INCLUDE: DNA structure (double helix, nucleotides, base pairs), protein synthesis overview, mutations and their effects
❌ EXCLUDE: Detailed transcription/translation steps, codon tables
🎯 FOCUS: Structure of DNA, how genes code for proteins, types of mutations and their consequences
📝 EXAM TIP: DNA bases: A pairs with T, C pairs with G. Mutations can be beneficial, harmful, or neutral'
WHERE id = 'e7c191c3-e247-41b7-bcf1-1675636b3dca';

UPDATE course_lessons SET description = '✅ INCLUDE: Sexual reproduction (meiosis, gametes, fertilisation), asexual reproduction (mitosis, cloning), comparing advantages/disadvantages
❌ EXCLUDE: Detailed stages of meiosis, cloning techniques beyond basics
🎯 FOCUS: Comparing sexual vs asexual reproduction, genetic variation, examples in plants and animals
📝 EXAM TIP: Sexual = genetic variation (2 parents, meiosis). Asexual = genetically identical offspring (1 parent, mitosis)'
WHERE id = '34fac9a7-a3b4-4fe5-89f9-faac218c26ad';

UPDATE course_lessons SET description = '✅ INCLUDE: Mendel''s experiments with pea plants, discovery of inheritance patterns, dominant and recessive alleles, importance of Mendel''s work
❌ EXCLUDE: Hardy-Weinberg equilibrium, population genetics
🎯 FOCUS: Understanding Mendel''s contribution, dominant vs recessive traits, why Mendel''s work was ignored initially
📝 EXAM TIP: Mendel worked before DNA was discovered - his work was rediscovered and proved correct later'
WHERE id = '24c4c92d-9931-4f55-a3a9-706cf6523a0a';

-- Ecology
UPDATE course_lessons SET description = '✅ INCLUDE: Intraspecific and interspecific competition, biotic and abiotic factors, interdependence, adaptations for survival
❌ EXCLUDE: Mathematical models of competition, niche theory
🎯 FOCUS: Resources organisms compete for, how environmental factors affect distribution, examples of adaptations
📝 EXAM TIP: Animals compete for: food, water, territory, mates. Plants compete for: light, water, minerals, space'
WHERE id = 'e511539e-20a5-4f00-af3e-204d60ff88b9';

UPDATE course_lessons SET description = '✅ INCLUDE: Sampling techniques (quadrats, transects), calculating population size, biodiversity measurement, required practical
❌ EXCLUDE: Complex statistical analysis, mark-release-recapture calculations
🎯 FOCUS: Using quadrats to estimate population, random sampling, calculating mean and percentage cover
📝 EXAM TIP: Random sampling avoids bias. Use random number generators to select quadrat positions'
WHERE id = 'a341f5ce-b2ef-4bc9-8906-7237c8877096';

UPDATE course_lessons SET description = '✅ INCLUDE: Carbon cycle, water cycle, decay and decomposition, factors affecting decay rate
❌ EXCLUDE: Detailed biogeochemical processes, nitrogen cycle details
🎯 FOCUS: How carbon moves through ecosystems, role of decomposers, required practical on decay
📝 EXAM TIP: Carbon enters food chain via photosynthesis, returns to atmosphere via respiration, combustion, and decomposition'
WHERE id = '7ad383f7-4f61-4151-9add-e0f4b6c563ec';

UPDATE course_lessons SET description = '✅ INCLUDE: Competition for resources, adaptations, population changes, predator-prey relationships
❌ EXCLUDE: Complex population dynamics, Lotka-Volterra equations
🎯 FOCUS: How organisms compete for limited resources, examples of structural, behavioural, and functional adaptations
📝 EXAM TIP: Resources animals compete for: food, water, territory, mates. Plants: light, water, minerals, space'
WHERE id = '917c57a8-cf48-43a8-b1d1-0a84a21f5d56';

UPDATE course_lessons SET description = '✅ INCLUDE: Decomposition process, factors affecting decay (temperature, oxygen, moisture), composting, required practical
❌ EXCLUDE: Detailed biochemistry of decomposition, industrial composting
🎯 FOCUS: Role of decomposers in nutrient cycling, investigating effect of temperature on decay rate
📝 EXAM TIP: Warm, moist conditions with good oxygen supply speed up decay - ideal for decomposer enzymes'
WHERE id = '5a832d27-1570-46d2-98c1-689a2c4c9db6';

UPDATE course_lessons SET description = '✅ INCLUDE: Genetic engineering basics, GM crops, cloning, selective breeding in agriculture, biogas production
❌ EXCLUDE: Detailed genetic engineering techniques, CRISPR mechanisms
🎯 FOCUS: Applications of biotechnology in food production, advantages and disadvantages of GM organisms
📝 EXAM TIP: Selective breeding = choosing organisms with desired traits to breed together over many generations'
WHERE id = '16bec09d-2de8-4e6b-a264-bc4cd08f33ab';

-- Quiz/Assessment lessons - keep brief but accurate
UPDATE course_lessons SET description = '✅ INCLUDE: Microscope use, magnification calculations, cell structure identification, comparing cell types
🎯 FOCUS: Applying knowledge of microscopy and cell structure to exam-style questions'
WHERE id = 'ccfd004f-6cac-4b51-a0e3-57ae8927cddd';

UPDATE course_lessons SET description = '✅ INCLUDE: Diffusion, osmosis, active transport calculations and explanations
🎯 FOCUS: Applying knowledge of substance exchange to exam-style questions'
WHERE id = 'cbd89eff-8a61-4fb0-863b-e85ecd846f11';

UPDATE course_lessons SET description = '✅ INCLUDE: Cell biology topics - cells, transport, microscopy, specialisation
🎯 FOCUS: End of unit assessment covering all cell biology content'
WHERE id = 'a98464db-1469-49a2-ae18-373f0acd5cda';

UPDATE course_lessons SET description = '✅ INCLUDE: Tissues, organs, organ systems, digestive system
🎯 FOCUS: Applying knowledge of cell organisation to exam-style questions'
WHERE id = '5b359d19-93aa-4f41-9905-f4e6ce5974cc';

UPDATE course_lessons SET description = '✅ INCLUDE: Heart structure, blood vessels, gas exchange, breathing
🎯 FOCUS: Applying knowledge of circulatory and respiratory systems to exam-style questions'
WHERE id = '53dac651-34b3-4bf6-a6fa-f3ea170d4e74';

UPDATE course_lessons SET description = '✅ INCLUDE: Plant cell structures, chloroplasts, cell wall, vacuole
🎯 FOCUS: Applying knowledge of plant cells to exam-style questions'
WHERE id = 'eefb2d49-fd9d-457d-82a5-5b31d2a1bf57';

UPDATE course_lessons SET description = '✅ INCLUDE: Organisation unit - digestive system, circulatory system, plant tissues
🎯 FOCUS: End of unit assessment covering all organisation content'
WHERE id = '1b778127-2ad2-4c63-be9f-fef6f1be6b04';

UPDATE course_lessons SET description = '✅ INCLUDE: Pathogens, transmission, body defences, immune response
🎯 FOCUS: Applying knowledge of disease to exam-style questions'
WHERE id = 'b2a150ee-33d7-4f64-85f6-d8a3fbe885d7';

UPDATE course_lessons SET description = '✅ INCLUDE: Drug development, clinical trials, antibiotics, painkillers
🎯 FOCUS: Applying knowledge of drug treatment to exam-style questions'
WHERE id = '624fa556-d3be-4e63-beaf-776511a198c9';

UPDATE course_lessons SET description = '✅ INCLUDE: Infection and response unit - pathogens, vaccines, antibiotics, plant diseases
🎯 FOCUS: End of unit assessment covering all infection and response content'
WHERE id = '323301d0-04bb-4a53-83c5-60263e25bd5b';

UPDATE course_lessons SET description = '✅ INCLUDE: Bioenergetics unit - photosynthesis, respiration, metabolism
🎯 FOCUS: End of unit assessment covering all bioenergetics content'
WHERE id = 'e9f397f8-883a-4dbf-9082-3bb145cebb62';

UPDATE course_lessons SET description = '✅ INCLUDE: Puberty hormones, menstrual cycle, fertility treatments
🎯 FOCUS: Applying knowledge of reproduction hormones to exam-style questions'
WHERE id = '8aca286b-9557-43dc-9990-137a5d6426c4';

UPDATE course_lessons SET description = '✅ INCLUDE: Homeostasis and response unit - nervous system, hormones, kidneys, reproduction
🎯 FOCUS: End of unit assessment covering all homeostasis and response content'
WHERE id = '00bc5f1c-6f5e-4ae9-b2be-a7c43679edd7';

UPDATE course_lessons SET description = '✅ INCLUDE: Punnett squares, genetic crosses, probability of inheritance
🎯 FOCUS: Applying knowledge of genetic diagrams to exam-style questions'
WHERE id = 'fd017887-1f87-4acc-8381-94b602cce5eb';

UPDATE course_lessons SET description = '✅ INCLUDE: Competition, adaptations, ecosystem interactions
🎯 FOCUS: Applying knowledge of ecosystems to exam-style questions'
WHERE id = '3370885b-f361-4140-b874-7d8aba075901';

-- Intro/Welcome lessons
UPDATE course_lessons SET description = '✅ INCLUDE: Course overview, exam structure, key topics, study strategies for GCSE Biology
🎯 FOCUS: Understanding what to expect from the GCSE Biology course and how to succeed'
WHERE id = '3b94fab8-fa4b-464e-930a-53bdade17d72';

UPDATE course_lessons SET description = '✅ INCLUDE: Revision strategies, exam techniques, topic overview for GCSE Biology
🎯 FOCUS: How to approach revision effectively and maximise exam performance'
WHERE id = '71272014-7417-435d-9405-f801d832b5fe';

UPDATE course_lessons SET description = '✅ INCLUDE: Practice test covering all GCSE Biology topics
🎯 FOCUS: Full practice assessment to test overall Biology knowledge'
WHERE id = 'f77077d8-f16e-4b10-9e4b-ce7fee1bb821';

UPDATE course_lessons SET description = '✅ INCLUDE: Testing knowledge of cell structure, organelles, cell types
🎯 FOCUS: Quick knowledge check on cells topic'
WHERE id = '1bfd2b16-02a2-4d6d-a97f-3cec85a660d1';
