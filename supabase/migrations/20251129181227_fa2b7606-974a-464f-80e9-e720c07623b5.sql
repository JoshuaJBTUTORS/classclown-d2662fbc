
-- Populate rich GCSE scope descriptions for ALL Biology lessons
-- Cell Biology Module
UPDATE course_lessons SET description = '✅ INCLUDE: Differences between eukaryotic (animal/plant) and prokaryotic (bacteria) cells, cell membrane, cytoplasm, ribosomes, genetic material location, size comparison (μm scale).

❌ EXCLUDE: Detailed membrane structure (fluid mosaic model), ribosome subunits (70S/80S), plasmid replication mechanisms, endosymbiotic theory detail.

🎯 FOCUS: Students can identify and compare the two cell types, knowing prokaryotes are smaller and lack membrane-bound organelles.

📝 EXAM TIP: Common comparison table questions - know key differences in size, DNA location, and organelles present.' 
WHERE title ILIKE '%eukaryotic%prokaryotic%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: Nucleus (contains DNA), cell membrane, cytoplasm, mitochondria, ribosomes. Plant extras: cell wall, chloroplasts, permanent vacuole. Drawing and labelling cells.

❌ EXCLUDE: Detailed organelle internal structure, cristae/matrix in mitochondria, grana/stroma in chloroplasts, rough vs smooth ER detail.

🎯 FOCUS: Students can draw, label and state functions of organelles in both cell types.

📝 EXAM TIP: 6-mark questions often ask to compare animal and plant cells - use a table format in your answer.' 
WHERE title ILIKE '%animal%plant%cell%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: Examples of specialised cells (sperm, nerve, muscle, root hair, xylem, phloem), how structure relates to function, adaptations for specific roles.

❌ EXCLUDE: Detailed cytoskeleton structure, molecular basis of muscle contraction, action potential mechanisms, detailed sieve tube companion cell interactions.

🎯 FOCUS: Students can explain how cell structure is adapted to function for each example.

📝 EXAM TIP: Questions ask "Explain how X cell is adapted for its function" - always link structure to function.' 
WHERE title ILIKE '%cell specialisation%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: Definition of differentiation, difference between plant and animal cell differentiation, stem cells in animals vs meristems in plants, why most animal cells lose ability to differentiate.

❌ EXCLUDE: Epigenetic mechanisms, gene regulation detail, transcription factors, chromatin remodelling.

🎯 FOCUS: Students understand differentiation as the process by which cells become specialised.

📝 EXAM TIP: Know that plant cells can differentiate throughout life but most animal cells differentiate early in development.' 
WHERE title ILIKE '%cell differentiation%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: Light microscope vs electron microscope comparison, magnification calculation (M = I/A), resolution definition, how to use a light microscope, preparing slides, staining.

❌ EXCLUDE: Detailed electron microscope operation, SEM vs TEM comparison detail, electron beam physics, specific staining mechanisms.

🎯 FOCUS: Students can calculate magnification and understand the difference between magnification and resolution.

📝 EXAM TIP: Required practical - using a light microscope. Magnification calculations very common - show working!' 
WHERE title ILIKE '%microscopy%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: Aseptic technique, why we use it (prevent contamination), sterilising equipment, incubating at 25°C in schools (not 37°C), calculating colonies, safe disposal.

❌ EXCLUDE: Detailed growth curve phases (lag, log, stationary, death), serial dilution calculations, specific growth media compositions, bacterial genetics.

🎯 FOCUS: Students understand why aseptic technique is important and how to culture safely.

📝 EXAM TIP: Required practical - know the steps and why each is important for preventing contamination.' 
WHERE title ILIKE '%culturing microorganisms%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: Mitosis produces 2 genetically identical diploid cells, cell cycle stages (interphase, mitosis, cytokinesis), why mitosis is needed (growth, repair, asexual reproduction), chromosome replication, IPMAT stages overview.

❌ EXCLUDE: Detailed spindle fiber mechanics, kinetochore attachment, motor proteins, cohesin/condensin proteins, checkpoints and cyclins, centriole structure.

🎯 FOCUS: Students understand WHAT happens in mitosis and WHY - not molecular mechanisms.

📝 EXAM TIP: Questions often ask to order the stages or explain why mitosis is important - know the outcomes.' 
WHERE title ILIKE '%mitosis%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: What stem cells are, embryonic vs adult stem cells, potential uses (treating diseases, growing organs), ethical issues around embryonic stem cells, meristems in plants.

❌ EXCLUDE: Induced pluripotent stem cells (iPSCs) detail, Yamanaka factors, detailed differentiation pathways, specific growth factors.

🎯 FOCUS: Students can discuss uses and ethical considerations of stem cell research.

📝 EXAM TIP: 6-mark questions often ask about benefits AND ethical concerns - cover both sides.' 
WHERE title ILIKE '%stem cells%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: Definition (net movement from high to low concentration), factors affecting rate (concentration gradient, temperature, surface area, distance), examples in living organisms (oxygen in lungs, CO2 out).

❌ EXCLUDE: Fick''s Law calculations, partial pressure gradients, detailed membrane permeability mechanisms, facilitated diffusion channel protein structure.

🎯 FOCUS: Students understand diffusion is passive (no energy), and can explain factors affecting rate.

📝 EXAM TIP: Required practical - investigate effect of concentration on rate of diffusion. Link to real examples.' 
WHERE title ILIKE '%diffusion%' AND title NOT ILIKE '%facilitated%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: Definition (movement of water across partially permeable membrane from dilute to concentrated solution), effect on plant and animal cells (turgid, flaccid, plasmolysed, lysed, crenated), water potential concept simply.

❌ EXCLUDE: Water potential calculations (Ψ = Ψs + Ψp), pressure potential detail, detailed osmotic pressure calculations, van''t Hoff equation.

🎯 FOCUS: Students understand osmosis as water movement and can predict what happens to cells in different solutions.

📝 EXAM TIP: Required practical - osmosis in potato chips. Know how to calculate % change in mass.' 
WHERE title ILIKE '%osmosis%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: Definition (movement against concentration gradient using energy from respiration), where it occurs (root hair cells absorbing minerals, gut absorbing glucose), requires carrier proteins and ATP.

❌ EXCLUDE: Detailed ATP hydrolysis mechanism, sodium-potassium pump molecular detail, electrochemical gradients, co-transport mechanisms detail.

🎯 FOCUS: Students understand active transport requires energy and moves substances against the gradient.

📝 EXAM TIP: Compare active transport to diffusion and osmosis - know the key differences.' 
WHERE title ILIKE '%active transport%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: Surface area to volume ratio calculations and why it matters, adaptations of exchange surfaces (thin walls, large SA, good blood supply, ventilation), examples: alveoli, villi, fish gills, plant roots and leaves.

❌ EXCLUDE: Fick''s Law equation and calculations, partial pressure gradients, countercurrent exchange mechanism detail, detailed capillary structure.

🎯 FOCUS: Students understand WHY organisms need specialised exchange surfaces and how adaptations increase efficiency.

📝 EXAM TIP: 6-mark questions ask "Explain how X is adapted for efficient exchange" - always link structure to function.' 
WHERE title ILIKE '%exchange surfaces%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

-- Organisation Module
UPDATE course_lessons SET description = '✅ INCLUDE: Hierarchy: cells → tissues → organs → organ systems → organism. Examples of each level, definition of tissue (group of similar cells working together).

❌ EXCLUDE: Detailed histology, tissue engineering, specific cell signalling between tissues.

🎯 FOCUS: Students can define each level and give examples.

📝 EXAM TIP: Know examples at each level for both plants and animals.' 
WHERE title ILIKE '%principles of organisation%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: Lock and key model, substrate and active site, factors affecting enzyme activity (temperature, pH, substrate concentration), denaturation, optimum conditions, enzyme-substrate complex.

❌ EXCLUDE: Induced fit model, Michaelis-Menten kinetics, Km/Vmax calculations, competitive vs non-competitive inhibition mechanisms, allosteric regulation, activation energy graphs.

🎯 FOCUS: Students understand enzymes as biological catalysts with specific shapes that can be denatured.

📝 EXAM TIP: Required practical - investigate effect of pH on amylase. Graph interpretation questions very common.' 
WHERE title ILIKE '%enzyme%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: Main organs (mouth, oesophagus, stomach, small intestine, large intestine), role of each organ, digestive enzymes (amylase, protease, lipase), where enzymes are produced, role of bile.

❌ EXCLUDE: Detailed enzyme secretion mechanisms, hormonal control of digestion (secretin, CCK), detailed absorption mechanisms, enterocyte structure.

🎯 FOCUS: Students know the journey of food and which enzymes break down which food types.

📝 EXAM TIP: Know: carbohydrases→sugars, proteases→amino acids, lipases→fatty acids and glycerol.' 
WHERE title ILIKE '%digestive system%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: Tests for starch (iodine - blue/black), glucose (Benedict''s - brick red), protein (Biuret - purple), lipids (ethanol emulsion - cloudy white). Method and results.

❌ EXCLUDE: Quantitative Benedict''s, colorimetry, chromatography, detailed biochemistry of reactions.

🎯 FOCUS: Students can describe how to carry out each test and state the positive result.

📝 EXAM TIP: Required practical - know the method, positive result, and safety precautions for each test.' 
WHERE title ILIKE '%food tests%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: Structure of lungs (trachea, bronchi, bronchioles, alveoli), gas exchange at alveoli, adaptations for efficient exchange (large SA, thin walls, good blood supply, ventilation), breathing mechanism.

❌ EXCLUDE: Partial pressure calculations, detailed surfactant chemistry, spirometry trace analysis detail, lung compliance calculations.

🎯 FOCUS: Students can explain how alveoli are adapted for gas exchange.

📝 EXAM TIP: Link adaptations to efficient diffusion - thin walls = short diffusion distance.' 
WHERE title ILIKE '%lungs%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: Structure (4 chambers, valves, major blood vessels), double circulatory system, pathway of blood through heart, role of valves, cardiac cycle basics.

❌ EXCLUDE: Detailed cardiac cycle pressure changes, ECG interpretation detail, cardiac output calculations, Frank-Starling mechanism.

🎯 FOCUS: Students can label heart diagram and describe blood flow through it.

📝 EXAM TIP: Remember: right side pumps to lungs (deoxygenated), left side pumps to body (oxygenated).' 
WHERE title ILIKE '%heart%' AND title NOT ILIKE '%coronary%' AND title NOT ILIKE '%disease%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: Structure and function of arteries, veins, and capillaries. Adaptations: thick walls/elastic (arteries), valves (veins), thin walls/small (capillaries). Compare in table.

❌ EXCLUDE: Detailed smooth muscle contraction, vasodilation mechanisms, blood pressure regulation, Starling forces in capillaries.

🎯 FOCUS: Students can compare the three vessel types and explain how structure suits function.

📝 EXAM TIP: Know the comparison table - structure differences and reasons for each.' 
WHERE title ILIKE '%blood vessels%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: Components of blood (plasma, red blood cells, white blood cells, platelets), function of each component, adaptations of red blood cells (biconcave, no nucleus, haemoglobin).

❌ EXCLUDE: Oxygen dissociation curves, Bohr effect, detailed clotting cascade, specific white blood cell types beyond phagocytes/lymphocytes.

🎯 FOCUS: Students can describe the function of each blood component.

📝 EXAM TIP: Red blood cells: no nucleus = more space for haemoglobin, biconcave = large surface area.' 
WHERE title = 'Blood' OR (title ILIKE '%blood%' AND title NOT ILIKE '%vessels%' AND title NOT ILIKE '%glucose%' AND title NOT ILIKE '%pressure%') AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: What CHD is (fatty deposits in coronary arteries), risk factors (diet, smoking, lack of exercise), treatments (stents, statins, bypass surgery), how lifestyle affects risk.

❌ EXCLUDE: Detailed atherosclerosis mechanism, specific drug mechanisms beyond basic statins, detailed surgical procedures, lipid metabolism pathways.

🎯 FOCUS: Students understand causes, risk factors, and treatments for CHD.

📝 EXAM TIP: Questions often ask to evaluate treatments - know advantages and disadvantages of each.' 
WHERE title ILIKE '%coronary heart disease%' OR title ILIKE '%CHD%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: Difference between health and disease, communicable vs non-communicable diseases, risk factors for non-communicable diseases, how diseases can interact.

❌ EXCLUDE: Detailed epidemiology, specific disease mechanisms at molecular level, public health statistics analysis.

🎯 FOCUS: Students understand the difference between communicable and non-communicable diseases and their risk factors.

📝 EXAM TIP: Be able to discuss how lifestyle factors (smoking, diet, exercise) affect disease risk.' 
WHERE title ILIKE '%health and disease%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: What cancer is (uncontrolled cell division), benign vs malignant tumours, risk factors (smoking, UV, genetics, obesity), lifestyle changes to reduce risk.

❌ EXCLUDE: Oncogenes and tumour suppressor genes detail, cell cycle checkpoints, specific cancer treatments (chemotherapy mechanisms), metastasis mechanisms.

🎯 FOCUS: Students understand cancer as uncontrolled cell division and can discuss risk factors.

📝 EXAM TIP: Know difference: benign = stays in one place, malignant = can spread (metastasise).' 
WHERE title ILIKE '%cancer%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: Plant tissues (epidermal, palisade mesophyll, spongy mesophyll, xylem, phloem, meristem), plant organs (roots, stem, leaves), how tissues work together.

❌ EXCLUDE: Detailed cell wall biochemistry, lignification mechanisms, Casparian strip detail, secondary growth.

🎯 FOCUS: Students can identify plant tissues and explain their functions.

📝 EXAM TIP: Know leaf structure - palisade cells near top (most light), spongy mesophyll for gas exchange.' 
WHERE title ILIKE '%plant%organisation%' OR title ILIKE '%plant%organ%' OR title ILIKE '%plant tissue%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: Transpiration definition, factors affecting rate (light, temperature, humidity, wind), how stomata control water loss, translocation definition (movement of sugars), xylem vs phloem comparison.

❌ EXCLUDE: Cohesion-tension theory detail, pressure flow hypothesis detail, water potential gradients, potometer calculations beyond basics.

🎯 FOCUS: Students understand transpiration as water loss from leaves and how environmental factors affect rate.

📝 EXAM TIP: Required practical - investigate effect of environmental factors using a potometer.' 
WHERE title ILIKE '%transpiration%' OR title ILIKE '%translocation%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

-- Infection and Response Module
UPDATE course_lessons SET description = '✅ INCLUDE: Types of pathogen (bacteria, viruses, fungi, protists), how pathogens spread (direct contact, water, air), how pathogens cause disease (producing toxins, damaging cells).

❌ EXCLUDE: Detailed pathogen classification, Koch''s postulates, specific virulence factors, pathogenicity mechanisms at molecular level.

🎯 FOCUS: Students know the four types of pathogen and how they spread/cause disease.

📝 EXAM TIP: Remember: bacteria produce toxins, viruses damage cells by reproducing inside them.' 
WHERE title ILIKE '%communicable disease%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: Measles (spread by droplets, symptoms, MMR vaccine), HIV (spread by body fluids, attacks immune cells, leads to AIDS, antiretroviral drugs), TMV in plants (mosaic pattern, spread by contact).

❌ EXCLUDE: Viral replication cycles detail, specific antiviral drug mechanisms, viral genome structures, immunology of HIV beyond basics.

🎯 FOCUS: Students know specific viral diseases, how they spread, and how they''re treated/prevented.

📝 EXAM TIP: Know transmission, symptoms, and prevention for each named disease.' 
WHERE title ILIKE '%viral disease%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: Salmonella (food poisoning, symptoms, prevention through cooking), Gonorrhoea (STI, symptoms, antibiotic treatment, antibiotic resistance issue).

❌ EXCLUDE: Bacterial cell structure detail, specific antibiotic mechanisms, bacterial resistance mechanisms at genetic level.

🎯 FOCUS: Students know these bacterial diseases, transmission, symptoms, and treatments.

📝 EXAM TIP: Gonorrhoea question often links to antibiotic resistance - explain why this is a problem.' 
WHERE title ILIKE '%bacterial disease%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: Rose black spot (fungus, spread by wind/water, treated with fungicides), Malaria (protist, spread by mosquito vector, symptoms, prevention methods like bed nets).

❌ EXCLUDE: Fungal life cycles, Plasmodium life cycle detail, antimalarial drug mechanisms, vector control genetics.

🎯 FOCUS: Students know examples of fungal and protist diseases, their spread, and prevention.

📝 EXAM TIP: Malaria prevention focuses on stopping mosquito bites - bed nets, insecticides.' 
WHERE title ILIKE '%fungal%' OR title ILIKE '%protist%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: Physical barriers (skin, nose hairs, trachea cilia and mucus), chemical barriers (stomach acid, lysozyme in tears), immune response basics (white blood cells: phagocytosis, antibody production, antitoxins).

❌ EXCLUDE: Detailed complement system, MHC/antigen presentation, T cell types and functions, cytokine signalling, inflammation cascade.

🎯 FOCUS: Students can describe the three lines of defence simply.

📝 EXAM TIP: Know what phagocytes do (engulf) vs lymphocytes (produce antibodies).' 
WHERE title ILIKE '%human defence%' OR title ILIKE '%defence system%' OR title ILIKE '%immune system%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: How vaccines work (dead/inactive pathogen triggers immune response, memory cells produced, faster secondary response), herd immunity concept, why some people can''t be vaccinated.

❌ EXCLUDE: Vaccine types detail (live attenuated, mRNA, subunit), adjuvants, specific antibody structure, detailed immunological memory mechanisms.

🎯 FOCUS: Students understand vaccines trigger immune response without causing disease, creating memory for protection.

📝 EXAM TIP: Questions ask "Explain why vaccinated people don''t get ill when exposed to the pathogen."' 
WHERE title ILIKE '%vaccination%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: What antibiotics are (kill bacteria, not viruses), why antibiotics don''t work on viruses, antibiotic resistance problem, how resistance develops (natural selection), MRSA as example.

❌ EXCLUDE: Specific antibiotic mechanisms (beta-lactams, etc.), horizontal gene transfer mechanisms, specific resistance genes.

🎯 FOCUS: Students understand why we shouldn''t overuse antibiotics and how resistance develops through natural selection.

📝 EXAM TIP: Explain resistance using natural selection: variation → survival of resistant bacteria → reproduction.' 
WHERE title ILIKE '%antibiotic%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: Discovery and development process (preclinical testing, clinical trials phases 1-3), why it takes so long, placebos and double-blind trials, safety vs efficacy.

❌ EXCLUDE: Specific drug targets, pharmacokinetics/pharmacodynamics, detailed toxicology, regulatory approval processes detail.

🎯 FOCUS: Students understand why drug testing is important and the stages involved.

📝 EXAM TIP: Know why double-blind trials and placebos are used - to ensure fair testing.' 
WHERE title ILIKE '%drug development%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: What monoclonal antibodies are (identical antibodies from cloned B cells), how they''re produced (hybridoma technique simply), uses (pregnancy tests, cancer treatment, diagnosis).

❌ EXCLUDE: Detailed hybridoma fusion technique, specific cancer drug names and mechanisms, antibody engineering, chimeric antibodies.

🎯 FOCUS: Students understand how monoclonal antibodies are made and their uses.

📝 EXAM TIP: Know advantages (specific targeting) and disadvantages (side effects, expensive) of monoclonal antibodies.' 
WHERE title ILIKE '%monoclonal antibod%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: How to detect plant diseases (stunted growth, spots, discolouration, abnormal growths), identification methods (reference guides, testing kits, lab analysis), examples of plant diseases.

❌ EXCLUDE: Specific plant pathogen life cycles, plant immunity mechanisms at molecular level, detailed diagnostic techniques.

🎯 FOCUS: Students can identify signs of plant disease and suggest detection methods.

📝 EXAM TIP: Link symptoms to possible causes - e.g., yellow leaves could be mineral deficiency or disease.' 
WHERE title ILIKE '%plant disease%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: Physical defences (cellulose cell wall, waxy cuticle, bark), chemical defences (antibacterial chemicals, poisons), mechanical defences (thorns, hairs, leaves that curl/drop).

❌ EXCLUDE: Specific phytochemicals and their mechanisms, plant immune signalling pathways, systemic acquired resistance.

🎯 FOCUS: Students can describe physical, chemical, and mechanical plant defences with examples.

📝 EXAM TIP: Give specific examples - e.g., caffeine and tannins as chemical defences.' 
WHERE title ILIKE '%plant defence%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

-- Bioenergetics Module
UPDATE course_lessons SET description = '✅ INCLUDE: Word equation (carbon dioxide + water → glucose + oxygen), symbol equation, where it occurs (chloroplasts), what the glucose is used for (respiration, cellulose, starch, proteins, lipids).

❌ EXCLUDE: Light-dependent reactions, light-independent reactions (Calvin cycle), photosystems, electron transport chain, RuBisCO, GP/GALP, detailed chloroplast structure.

🎯 FOCUS: Students know the equation and understand photosynthesis converts light energy to chemical energy in glucose.

📝 EXAM TIP: Learn both word AND symbol equations. Know the 5 uses of glucose.' 
WHERE title ILIKE '%photosynthesis%' AND title NOT ILIKE '%rate%' AND title NOT ILIKE '%limiting%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: Factors that affect rate (light intensity, CO2 concentration, temperature), how to investigate each factor, inverse square law for light (simply), interpreting rate graphs.

❌ EXCLUDE: Detailed biochemistry of why factors affect rate, compensation point calculations, detailed photometer/oxygen sensor analysis.

🎯 FOCUS: Students can explain how each factor affects rate and interpret graphs showing limiting factors.

📝 EXAM TIP: Required practical - know how to investigate effect of light intensity. Graph interpretation very common.' 
WHERE title ILIKE '%rate%photosynthesis%' OR title ILIKE '%limiting factor%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: Definition of metabolism (all chemical reactions in an organism), examples of metabolic reactions (respiration, photosynthesis, protein synthesis from amino acids, lipid synthesis, breakdown of excess proteins).

❌ EXCLUDE: Detailed metabolic pathways, specific enzymes in pathways, regulation of metabolism, metabolic rate calculations.

🎯 FOCUS: Students understand metabolism as the sum of all reactions and can give examples.

📝 EXAM TIP: Know that metabolism includes building up molecules (anabolism) and breaking down (catabolism).' 
WHERE title ILIKE '%metabolism%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: Word equation (glucose + oxygen → carbon dioxide + water), symbol equation, where it occurs (mitochondria), energy released used for (muscle contraction, body temperature, chemical reactions, active transport).

❌ EXCLUDE: Glycolysis, Krebs cycle, electron transport chain, oxidative phosphorylation, ATP yield (32-38), NAD/FAD, chemiosmosis.

🎯 FOCUS: Students know the equation and that aerobic respiration releases MORE energy than anaerobic.

📝 EXAM TIP: Learn the equation! Know aerobic means WITH oxygen and releases more energy.' 
WHERE title ILIKE '%aerobic respiration%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: In muscles: glucose → lactic acid (word equation), in yeast: glucose → ethanol + carbon dioxide (fermentation), why less energy is released, oxygen debt and lactic acid removal.

❌ EXCLUDE: Glycolysis detail, ATP yield comparisons, lactate threshold, detailed fermentation biochemistry.

🎯 FOCUS: Students know both equations and understand anaerobic respiration is used when oxygen is limited.

📝 EXAM TIP: Know the difference: animals produce lactic acid, yeast produces ethanol + CO2.' 
WHERE title ILIKE '%anaerobic respiration%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: Changes during exercise (heart rate, breathing rate, breath volume increase), why these changes happen (more oxygen to muscles, remove CO2 faster), oxygen debt explanation, lactic acid removal (oxidised or converted to glucose in liver).

❌ EXCLUDE: VO2 max calculations, detailed cardiovascular response, lactate threshold training, specific muscle physiology.

🎯 FOCUS: Students can explain body changes during exercise and what happens during recovery.

📝 EXAM TIP: Explain oxygen debt: extra oxygen needed after exercise to break down lactic acid.' 
WHERE title ILIKE '%exercise%' OR title ILIKE '%response to exercise%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

-- Homeostasis and Response Module  
UPDATE course_lessons SET description = '✅ INCLUDE: Definition (maintaining a constant internal environment), why it''s important (for enzymes to work), examples of what''s controlled (body temperature, blood glucose, water levels), negative feedback loop concept.

❌ EXCLUDE: Detailed set point theory, complex feedback diagrams, specific receptor mechanisms, control theory mathematics.

🎯 FOCUS: Students understand homeostasis maintains constant conditions for optimal enzyme function.

📝 EXAM TIP: Always explain WHY conditions need to be controlled - link to enzyme function.' 
WHERE title ILIKE '%homeostasis%' AND title NOT ILIKE '%response%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: CNS (brain and spinal cord), receptors detect stimuli, effectors (muscles and glands) produce response, sensory/relay/motor neurones, structure of neurones (axon, dendrites, myelin sheath, synapses).

❌ EXCLUDE: Detailed action potential mechanism, ion channels, saltatory conduction, neurotransmitter synthesis and recycling, specific brain regions.

🎯 FOCUS: Students can describe the pathway from stimulus to response and basic neurone structure.

📝 EXAM TIP: Know the pathway: stimulus → receptor → sensory neurone → CNS → motor neurone → effector → response.' 
WHERE title ILIKE '%nervous system%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: What a reflex is (fast, automatic, protective), reflex arc pathway (receptor → sensory neurone → relay neurone → motor neurone → effector), examples (pupil reflex, knee jerk, withdrawing hand from heat), why reflexes are important.

❌ EXCLUDE: Detailed spinal cord anatomy, interneurone types, polysynaptic reflexes, reflex modification.

🎯 FOCUS: Students can describe a reflex arc and explain why reflexes are fast and automatic.

📝 EXAM TIP: Required practical - investigate effect of factors on human reaction time.' 
WHERE title ILIKE '%reflex%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: Role of the brain (controls complex behaviour, memory, intelligence), difficulty studying the brain, treatment of brain disorders (limited), cerebral cortex (consciousness, intelligence), cerebellum (balance, coordination), medulla (unconscious activities like breathing, heart rate).

❌ EXCLUDE: Detailed brain anatomy beyond three named regions, specific neurotransmitter systems, brain imaging interpretation detail, neuroplasticity mechanisms.

🎯 FOCUS: Students know the three main brain regions and their functions.

📝 EXAM TIP: Only need to know cerebral cortex, cerebellum, and medulla - know their functions.' 
WHERE title ILIKE '%brain%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: Structure of the eye (cornea, iris, pupil, lens, retina, optic nerve), function of each part, accommodation (focusing on near/far objects - ciliary muscles and suspensory ligaments), pupil reflex, common vision defects (myopia, hyperopia) and corrections (glasses, contact lenses, laser surgery).

❌ EXCLUDE: Detailed retinal cell types (rods, cones, bipolar cells), phototransduction, detailed lens biochemistry, specific surgical procedures.

🎯 FOCUS: Students can label eye diagram, explain accommodation, and describe how defects are corrected.

📝 EXAM TIP: Know how ciliary muscles and suspensory ligaments work together for near vs far vision.' 
WHERE title ILIKE '%eye%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: How temperature is monitored (thermoregulatory centre in brain), responses to being too hot (vasodilation, sweating), responses to being too cold (vasoconstriction, shivering), negative feedback.

❌ EXCLUDE: Hypothalamus detail, specific thermoreceptor mechanisms, brown adipose tissue, detailed vasoconstriction mechanisms.

🎯 FOCUS: Students can explain the body''s responses to temperature changes and link to negative feedback.

📝 EXAM TIP: Vasodilation = blood vessels widen = more heat lost. Vasoconstriction = vessels narrow = less heat lost.' 
WHERE title ILIKE '%body temperature%' OR title ILIKE '%temperature control%' OR title ILIKE '%thermoregulation%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: What endocrine system is (glands that produce hormones), comparison with nervous system (slower, longer-lasting, chemical), main glands and their hormones (pituitary, thyroid, adrenal, pancreas, ovaries, testes).

❌ EXCLUDE: Detailed hormone synthesis, receptor mechanisms, second messengers, hypothalamic-pituitary axis detail.

🎯 FOCUS: Students can compare nervous and endocrine systems and name main glands/hormones.

📝 EXAM TIP: Know comparison table: nervous (fast, short-lived, electrical) vs endocrine (slow, long-lasting, chemical).' 
WHERE title ILIKE '%endocrine system%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: Role of pancreas (produces insulin and glucagon), what happens when blood glucose is too high (insulin released, glucose taken into cells, stored as glycogen), too low (glucagon released, glycogen converted to glucose), negative feedback loop.

❌ EXCLUDE: Insulin receptor mechanism, glucose transporter proteins (GLUT4), gluconeogenesis, detailed hormonal interactions.

🎯 FOCUS: Students can describe the negative feedback loop controlling blood glucose.

📝 EXAM TIP: 6-mark question often: "Describe how blood glucose is controlled after eating a meal."' 
WHERE title ILIKE '%blood glucose%' OR title ILIKE '%controlling blood glucose%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: Type 1 (pancreas doesn''t produce insulin, autoimmune, treated with insulin injections), Type 2 (body resistant to insulin or not enough produced, linked to obesity, treated with diet/exercise/medication), comparing causes and treatments.

❌ EXCLUDE: Detailed insulin resistance mechanisms, specific medications beyond "drugs that help insulin work", HbA1c testing detail, diabetic complications at molecular level.

🎯 FOCUS: Students can compare Type 1 and Type 2 diabetes - causes, who gets them, and treatments.

📝 EXAM TIP: Type 1 = no insulin made (inject insulin). Type 2 = insulin resistance (lifestyle changes first).' 
WHERE title ILIKE '%diabetes%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: FSH (stimulates egg maturation), LH (triggers ovulation), oestrogen (repairs uterus lining, inhibits FSH), progesterone (maintains uterus lining), how hormones interact in menstrual cycle.

❌ EXCLUDE: GnRH and hypothalamus, detailed follicle development, corpus luteum biochemistry, specific hormone receptor mechanisms.

🎯 FOCUS: Students can describe the roles of the four hormones in the menstrual cycle.

📝 EXAM TIP: Know the sequence: FSH → follicle grows → oestrogen → LH surge → ovulation → progesterone.' 
WHERE title ILIKE '%hormones%reproduction%' OR title ILIKE '%reproductive hormones%' OR title ILIKE '%menstrual cycle%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: Hormonal methods (pill, injection, implant, IUD) and how they work, barrier methods (condoms, diaphragm) and how they work, comparing effectiveness, advantages and disadvantages of each.

❌ EXCLUDE: Detailed pharmacology of contraceptive hormones, failure rate statistics detail, specific surgical sterilisation procedures.

🎯 FOCUS: Students can describe how different methods prevent pregnancy and evaluate them.

📝 EXAM TIP: Questions ask to evaluate methods - know advantages AND disadvantages of each.' 
WHERE title ILIKE '%contraception%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: What IVF is (fertilisation outside body), stages of IVF process, use of FSH and LH in treatment, success rates and emotional/physical/financial impacts, ethical considerations.

❌ EXCLUDE: Detailed embryo grading, specific culture media, genetic screening techniques (PGD), detailed hormone protocols.

🎯 FOCUS: Students understand the IVF process and can discuss its advantages, disadvantages, and ethics.

📝 EXAM TIP: 6-mark questions often ask about ethical issues - include multiple viewpoints.' 
WHERE title ILIKE '%IVF%' OR title ILIKE '%fertility treatment%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: What negative feedback is (response reduces the original stimulus), examples (blood glucose, body temperature), simple feedback loop diagrams, why it maintains stable conditions.

❌ EXCLUDE: Positive feedback examples in detail, control theory, set points and oscillation, complex multi-hormone feedback.

🎯 FOCUS: Students understand negative feedback as the mechanism that maintains homeostasis.

📝 EXAM TIP: Always draw a feedback loop diagram when explaining - shows clear understanding.' 
WHERE title ILIKE '%negative feedback%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: Auxins (cause cell elongation, unequal distribution causes bending), phototropism (response to light), gravitropism (response to gravity), how auxins redistribute in shoots and roots, uses of plant hormones (weedkillers, rooting powder, fruit ripening).

❌ EXCLUDE: Auxin receptor mechanisms, PIN proteins, detailed hormone signalling pathways, gibberellins and cytokinins at molecular level.

🎯 FOCUS: Students can explain how auxins cause phototropism and gravitropism.

📝 EXAM TIP: Know: shoots grow TOWARDS light (more auxin on dark side), roots grow DOWN (auxin inhibits root cell elongation).' 
WHERE title ILIKE '%plant hormone%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

-- Inheritance, Variation and Evolution
UPDATE course_lessons SET description = '✅ INCLUDE: Meiosis produces 4 genetically different haploid gametes, chromosome number halves (diploid → haploid), genetic variation created, two divisions occur (Meiosis I and II), comparison with mitosis outcomes, why meiosis is important for sexual reproduction.

❌ EXCLUDE: Detailed phases (Prophase I with synapsis, bivalents, chiasmata mechanisms), molecular mechanisms of crossing over, spindle fiber mechanics, cohesin proteins, independent assortment probability calculations.

🎯 FOCUS: Students understand meiosis halves chromosome number and creates genetic variation - OUTCOMES not MECHANISMS.

📝 EXAM TIP: Compare meiosis vs mitosis table questions very common - focus on outcomes (number of cells, genetic similarity, chromosome number).' 
WHERE title ILIKE '%meiosis%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: DNA structure (double helix, nucleotides with sugar, phosphate, bases), base pairing rules (A-T, C-G), what a gene is (section of DNA coding for protein), what the genome is (entire genetic material), Human Genome Project importance.

❌ EXCLUDE: DNA replication mechanism detail, semi-conservative replication, Okazaki fragments, DNA polymerase types, detailed chromatin structure.

🎯 FOCUS: Students can describe DNA structure and understand genes code for proteins.

📝 EXAM TIP: Know the base pairing rules and be able to work out complementary strands.' 
WHERE title ILIKE '%DNA%' OR title ILIKE '%genome%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: Genotype, phenotype, dominant, recessive, homozygous, heterozygous definitions. Punnett squares for monohybrid crosses, predicting offspring ratios, using genetic diagrams.

❌ EXCLUDE: Dihybrid crosses (AQA Triple only), chi-squared tests, Hardy-Weinberg equilibrium, epistasis, linkage.

🎯 FOCUS: Students can use Punnett squares to predict offspring genotypes and phenotypes.

📝 EXAM TIP: Always show working with Punnett squares. State the ratio clearly (e.g., 3:1).' 
WHERE title ILIKE '%genetic inheritance%' OR title ILIKE '%inheritance%' AND title NOT ILIKE '%inherited disorder%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: Polydactyly (dominant allele, extra fingers/toes), Cystic fibrosis (recessive allele, thick mucus, affects lungs), how these are inherited, Punnett squares for each, carrier concept.

❌ EXCLUDE: Molecular basis of disorders, CFTR protein detail, specific treatments beyond basics, genetic counselling detail.

🎯 FOCUS: Students can complete Punnett squares showing inheritance of these disorders.

📝 EXAM TIP: Remember: polydactyly is dominant (only need one copy), CF is recessive (need two copies).' 
WHERE title ILIKE '%inherited disorder%' OR title ILIKE '%genetic disorder%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: XX = female, XY = male, sex chromosomes, Punnett square showing 50:50 ratio, how sex is determined at fertilisation.

❌ EXCLUDE: SRY gene, detailed sex differentiation, hormonal control of sex development, intersex conditions.

🎯 FOCUS: Students can use a Punnett square to show why there''s a 50:50 ratio of males to females.

📝 EXAM TIP: The Y chromosome carries the gene for male development - if present, embryo develops as male.' 
WHERE title ILIKE '%sex determination%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: Genetic variation (mutations, sexual reproduction), environmental variation (diet, exercise, climate), continuous vs discontinuous variation, examples of each type.

❌ EXCLUDE: Quantitative genetics, heritability calculations, polygenic inheritance detail, epigenetics.

🎯 FOCUS: Students understand variation has genetic and environmental causes, often both.

📝 EXAM TIP: Height = both genetic AND environmental. Blood group = genetic only.' 
WHERE title ILIKE '%variation%' AND title NOT ILIKE '%evolution%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: Darwin''s theory of natural selection (variation, competition, survival of fittest, reproduction, inheritance), evidence for evolution (fossils, antibiotic resistance), how species change over time.

❌ EXCLUDE: Molecular evidence detail, phylogenetics, cladistics, specific evolutionary mechanisms (genetic drift, gene flow).

🎯 FOCUS: Students can explain natural selection step by step.

📝 EXAM TIP: Use the sequence: variation → competition → survival → reproduction → inheritance of beneficial traits.' 
WHERE title ILIKE '%evolution%' AND title NOT ILIKE '%theory%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: What selective breeding is, how it''s done (select individuals with desired characteristics, breed them, select best offspring, repeat), examples (crops, livestock, dogs), disadvantages (reduced variation, health problems, inbreeding).

❌ EXCLUDE: Quantitative trait loci, marker-assisted selection, detailed breeding programmes, genetic bottlenecks.

🎯 FOCUS: Students can describe the process of selective breeding and evaluate its advantages and risks.

📝 EXAM TIP: Know specific examples and their problems - e.g., bulldogs have breathing problems.' 
WHERE title ILIKE '%selective breeding%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: What genetic engineering is, basic process (cut gene out, insert into organism, organism expresses gene), examples (insulin from bacteria, GM crops), advantages and disadvantages, ethical concerns.

❌ EXCLUDE: Restriction enzymes and ligase detail, specific vectors, PCR, gel electrophoresis, CRISPR mechanism.

🎯 FOCUS: Students understand the basic concept and can discuss benefits and concerns.

📝 EXAM TIP: Questions often ask to evaluate GM crops - know advantages (higher yield, pest resistance) AND concerns (unknown effects, corporate control).' 
WHERE title ILIKE '%genetic engineering%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: What cloning is (genetically identical organisms), adult cell cloning process (Dolly the sheep), embryo transplants in animals, plant cloning (tissue culture, cuttings), advantages and disadvantages.

❌ EXCLUDE: Detailed nuclear transfer technique, somatic cell nuclear transfer mechanisms, therapeutic cloning stem cells.

🎯 FOCUS: Students can describe cloning methods and discuss advantages and disadvantages.

📝 EXAM TIP: Know the difference between embryo cloning and adult cell cloning.' 
WHERE title ILIKE '%cloning%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: Darwin''s observations and conclusions, Wallace''s contribution, why the theory was controversial, evidence that supports evolution (fossils, antibiotic resistance, similarities between species).

❌ EXCLUDE: Detailed history of evolutionary thought, specific molecular evidence, modern synthesis.

🎯 FOCUS: Students understand how Darwin and Wallace developed the theory and what evidence supports it.

📝 EXAM TIP: Know why it was controversial - challenged religious beliefs, not enough evidence at the time.' 
WHERE title ILIKE '%theory of evolution%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: What speciation is (formation of new species), how it happens (isolation, different selection pressures, genetic changes accumulate, can''t interbreed), geographical isolation, examples.

❌ EXCLUDE: Allopatric vs sympatric speciation detail, reproductive isolation mechanisms, ring species, hybrid zones.

🎯 FOCUS: Students can explain how one species can evolve into two through isolation.

📝 EXAM TIP: Key steps: population separated → different conditions → different selection → can''t interbreed = new species.' 
WHERE title ILIKE '%speciation%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: How fossils form (hard parts preserved, casts/impressions, preservation in ice/peat/amber), what fossils tell us about evolution, why fossil record is incomplete (soft tissue decay, not all conditions suitable).

❌ EXCLUDE: Radiometric dating detail, index fossils, detailed palaeontology, transitional fossils debate.

🎯 FOCUS: Students understand how fossils form and provide evidence for evolution.

📝 EXAM TIP: Know why fossil record has gaps - soft parts don''t fossilise, fossils can be destroyed.' 
WHERE title ILIKE '%fossil%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: What extinction is, causes of extinction (habitat loss, new predators/competitors, new diseases, environmental changes, catastrophic events), examples (dinosaurs, dodo).

❌ EXCLUDE: Mass extinction event detail, specific extinction mechanisms, de-extinction technology.

🎯 FOCUS: Students can list causes of extinction with examples.

📝 EXAM TIP: Questions often link to human activities causing extinction - habitat destruction, climate change.' 
WHERE title ILIKE '%extinction%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: How antibiotic resistance develops (mutation, survival, reproduction = natural selection), MRSA as example, why it''s a problem, how to reduce it (complete courses, don''t overuse, hygiene).

❌ EXCLUDE: Specific resistance mechanisms, horizontal gene transfer, specific antibiotic classes.

🎯 FOCUS: Students can explain antibiotic resistance as an example of evolution by natural selection.

📝 EXAM TIP: Use natural selection steps: variation (mutation) → selection (antibiotic kills susceptible) → survival → reproduction.' 
WHERE title ILIKE '%resistant bacteria%' OR title ILIKE '%antibiotic resistance%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

-- Ecology Module
UPDATE course_lessons SET description = '✅ INCLUDE: Definitions (habitat, population, community, ecosystem), interdependence, how organisms depend on each other, stable communities.

❌ EXCLUDE: Detailed ecological modelling, carrying capacity calculations, population dynamics equations.

🎯 FOCUS: Students understand ecological terms and how organisms are interdependent.

📝 EXAM TIP: Know the hierarchy: organism → population → community → ecosystem.' 
WHERE title ILIKE '%communit%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: Definition (non-living factors), examples (light intensity, temperature, moisture, soil pH, wind, CO2, oxygen levels), how changes affect distribution.

❌ EXCLUDE: Detailed environmental monitoring techniques, statistical analysis of abiotic factors, Liebig''s law of minimum.

🎯 FOCUS: Students can give examples of abiotic factors and explain how they affect organisms.

📝 EXAM TIP: Link abiotic factors to organism distribution - e.g., more light = more plants.' 
WHERE title ILIKE '%abiotic%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: Definition (living factors), examples (predation, competition, disease, availability of food), how changes affect populations.

❌ EXCLUDE: Lotka-Volterra equations, detailed predator-prey cycle analysis, competition coefficients.

🎯 FOCUS: Students can give examples of biotic factors and explain how they affect populations.

📝 EXAM TIP: Predator-prey relationships show cycles - more prey → more predators → fewer prey → fewer predators.' 
WHERE title ILIKE '%biotic%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: Structural adaptations (thick fur, large ears), behavioural adaptations (migration, nocturnal), functional adaptations (poison production), extremophiles (organisms in extreme conditions), examples from different environments.

❌ EXCLUDE: Detailed physiological mechanisms, biochemical adaptations at molecular level.

🎯 FOCUS: Students can describe adaptations and explain how they help organisms survive.

📝 EXAM TIP: Always explain HOW the adaptation helps survival - link structure to function.' 
WHERE title ILIKE '%adaptation%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: Producers, consumers (primary, secondary, tertiary), predators, prey, food chains and food webs, energy transfer (approximately 10% passes to next level), pyramids of biomass.

❌ EXCLUDE: Detailed energy calculations, pyramids of energy vs numbers analysis, trophic efficiency calculations.

🎯 FOCUS: Students can construct and interpret food chains/webs and explain energy loss at each level.

📝 EXAM TIP: Know why energy is lost - respiration, excretion, not all parts eaten. Only ~10% passes on.' 
WHERE title ILIKE '%food chain%' OR title ILIKE '%food web%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: Quadrats (random sampling), transects (systematic sampling), how to use them, calculating mean, mode, median, estimating population size.

❌ EXCLUDE: Statistical significance tests, Lincoln index detail, complex sampling design, Simpson''s diversity index.

🎯 FOCUS: Students can describe how to use quadrats and transects to sample populations.

📝 EXAM TIP: Required practical - sampling using quadrats. Know how to calculate mean and estimate population.' 
WHERE title ILIKE '%sampling%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: Photosynthesis removes CO2, respiration/combustion/decomposition release CO2, carbon stored in fossil fuels, simple cycle diagram, human impact (burning fossil fuels, deforestation).

❌ EXCLUDE: Carbon fixation mechanisms, ocean carbon chemistry detail, carbon isotope analysis, detailed decomposition biochemistry.

🎯 FOCUS: Students can draw and explain a simple carbon cycle.

📝 EXAM TIP: Often linked to climate change questions - explain how human activities increase atmospheric CO2.' 
WHERE title ILIKE '%carbon cycle%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: Evaporation, transpiration, condensation, precipitation, role of plants in water cycle, groundwater.

❌ EXCLUDE: Detailed hydrology, watershed analysis, water potential calculations.

🎯 FOCUS: Students can describe the main stages of the water cycle.

📝 EXAM TIP: Know how plants are involved - transpiration releases water into atmosphere.' 
WHERE title ILIKE '%water cycle%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: What biodiversity is (variety of species), why it''s important, threats to biodiversity (habitat destruction, pollution, climate change), how to maintain it (breeding programmes, seed banks, wildlife reserves).

❌ EXCLUDE: Simpson''s diversity index calculations, detailed conservation genetics, minimum viable population calculations.

🎯 FOCUS: Students understand why biodiversity matters and how we can protect it.

📝 EXAM TIP: Questions often ask to evaluate conservation methods - know advantages and limitations of each.' 
WHERE title ILIKE '%biodiversity%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: Causes (burning fossil fuels, deforestation, methane from agriculture), consequences (rising temperatures, ice melting, sea level rise, extreme weather, habitat changes), what can be done.

❌ EXCLUDE: Detailed climate models, specific greenhouse gas potentials, international policy detail.

🎯 FOCUS: Students understand causes and consequences of global warming.

📝 EXAM TIP: Link to carbon cycle - burning fossil fuels releases stored carbon as CO2.' 
WHERE title ILIKE '%global warming%' OR title ILIKE '%climate change%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: How humans use land (building, farming, quarrying, dumping waste), effects on habitats and biodiversity, pollution types (water, air, land), peat bog destruction issues.

❌ EXCLUDE: Detailed pollution chemistry, environmental impact assessment procedures, specific legislation.

🎯 FOCUS: Students understand how human land use affects the environment.

📝 EXAM TIP: Know why peat bogs matter - store carbon, releasing it adds to climate change.' 
WHERE title ILIKE '%land use%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: Why forests are cut down (timber, farmland, biofuels), consequences (habitat loss, species extinction, reduced biodiversity, less CO2 absorbed, releasing stored carbon), link to climate change.

❌ EXCLUDE: Detailed forest ecology, REDD+ schemes, specific forestry practices.

🎯 FOCUS: Students understand the environmental impacts of deforestation.

📝 EXAM TIP: Double impact on CO2: 1) less photosynthesis removing CO2, 2) burning/decay releases stored carbon.' 
WHERE title ILIKE '%deforestation%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));

UPDATE course_lessons SET description = '✅ INCLUDE: Conservation methods (breeding programmes, seed banks, wildlife reserves, reforestation, reducing deforestation), sustainable development concept, recycling and reducing waste.

❌ EXCLUDE: Detailed conservation biology, population viability analysis, specific international agreements.

🎯 FOCUS: Students can describe methods to maintain biodiversity and evaluate their effectiveness.

📝 EXAM TIP: Questions ask to evaluate conservation programmes - discuss advantages AND limitations.' 
WHERE title ILIKE '%maintaining biodiversity%' OR title ILIKE '%conservation%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE title ILIKE '%biology%'));
