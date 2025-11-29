-- Chemistry Module 1: Atomic Structure and the Periodic Table
UPDATE public.course_lessons SET description = '✅ INCLUDE: Atoms as smallest particles of elements, protons/neutrons/electrons and their charges/masses, atomic number and mass number definitions, calculating subatomic particles from atomic notation
❌ EXCLUDE: Quantum numbers, electron orbital shapes (s/p/d/f), ionization energies, electron spin
🎯 FOCUS: Students identify subatomic particles and calculate numbers from atomic notation
📝 EXAM TIP: 2-3 mark calculations asking for protons/neutrons/electrons from atomic symbols like ¹⁴₆C' WHERE title ILIKE '%atom%structure%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%chemistry%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Elements as pure substances of one type of atom, periodic table arrangement by atomic number, symbols and names of common elements, element vs compound distinction
❌ EXCLUDE: Aufbau principle, Hund''s rule, electron configuration beyond simple shells
🎯 FOCUS: Students understand elements are fundamental substances arranged systematically
📝 EXAM TIP: 1-2 mark questions on element symbols or distinguishing elements from compounds' WHERE title ILIKE '%element%' AND title NOT ILIKE '%compound%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%chemistry%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Isotopes as atoms with same protons but different neutrons, calculating relative atomic mass from isotope abundances, uses of isotopes (carbon dating, medical tracers)
❌ EXCLUDE: Mass spectrometry interpretation, isotope separation techniques, nuclear binding energy
🎯 FOCUS: Students calculate RAM from isotope data and explain isotope differences
📝 EXAM TIP: 3-4 mark RAM calculations given isotope percentages and masses' WHERE title ILIKE '%isotope%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%chemistry%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Compounds formed from two or more elements chemically bonded, chemical formulas showing element ratios, naming simple compounds (oxides, chlorides, hydroxides)
❌ EXCLUDE: IUPAC nomenclature rules, coordination compounds, complex ion naming
🎯 FOCUS: Students write and interpret simple chemical formulas
📝 EXAM TIP: 1-2 marks for naming compounds or writing formulas from names' WHERE title ILIKE '%compound%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%chemistry%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Mixtures vs compounds, separation techniques (filtration, evaporation, distillation, chromatography), pure substances and melting/boiling points
❌ EXCLUDE: Fractional distillation column calculations, HPLC, gas chromatography details
🎯 FOCUS: Students choose appropriate separation methods and explain how they work
📝 EXAM TIP: 4-6 mark questions on separating specific mixtures with method explanations' WHERE (title ILIKE '%mixture%' OR title ILIKE '%separation%' OR title ILIKE '%distillation%' OR title ILIKE '%chromatography%' OR title ILIKE '%filtration%') AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%chemistry%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Periodic table groups and periods, electron configuration in shells (2,8,8), how electron arrangement determines group, metals vs non-metals positions
❌ EXCLUDE: d-block electron configurations, transition metal properties detail, periodic trends calculations
🎯 FOCUS: Students deduce electron arrangement from position and explain group properties
📝 EXAM TIP: 2-3 marks linking electron configuration to group number and reactivity' WHERE (title ILIKE '%periodic table%' OR title ILIKE '%periodic%trend%' OR title ILIKE '%group%period%') AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%chemistry%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Group 1 alkali metals properties (soft, low density, reactive), reactions with water producing hydrogen and hydroxide, reactivity trend down group explained by electron shielding
❌ EXCLUDE: Flame photometry, organolithium compounds, detailed ionization energy trends
🎯 FOCUS: Students describe reactions and explain reactivity trend using atomic structure
📝 EXAM TIP: 4-6 marks describing lithium/sodium/potassium + water with equations and trend explanation' WHERE (title ILIKE '%group 1%' OR title ILIKE '%alkali metal%') AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%chemistry%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Group 7 halogens properties (coloured, diatomic molecules), reactivity trend down group (decreases), displacement reactions, halide tests with silver nitrate
❌ EXCLUDE: Halogen oxoacids, interhalogen compounds, electrode potentials for halogens
🎯 FOCUS: Students predict displacement reactions and explain reactivity trend
📝 EXAM TIP: 3-4 marks on halogen displacement with ionic equations and explanations' WHERE (title ILIKE '%group 7%' OR title ILIKE '%halogen%') AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%chemistry%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Group 0 noble gases properties (unreactive, monatomic, low boiling points), full outer shells explaining inertness, uses (helium balloons, argon welding)
❌ EXCLUDE: Noble gas compounds (XeF₂), clathrate compounds, van der Waals calculations
🎯 FOCUS: Students explain noble gas properties using electron configuration
📝 EXAM TIP: 2-3 marks explaining why noble gases are unreactive linking to full shells' WHERE (title ILIKE '%group 0%' OR title ILIKE '%noble gas%') AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%chemistry%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Electron shell diagrams for first 20 elements, maximum electrons per shell (2,8,8), drawing electron configurations, linking to periodic table position
❌ EXCLUDE: Subshell notation (1s²2s²2p⁶), orbital diagrams, electron spin pairing
🎯 FOCUS: Students draw shell diagrams and deduce configuration from atomic number
📝 EXAM TIP: 2 marks for drawing electron configuration of atoms up to calcium' WHERE (title ILIKE '%electron%' AND (title ILIKE '%configuration%' OR title ILIKE '%shell%' OR title ILIKE '%arrangement%')) AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%chemistry%'));

-- Chemistry Module 2: Bonding, Structure and Properties of Matter
UPDATE public.course_lessons SET description = '✅ INCLUDE: Ionic bonding as electron transfer between metals and non-metals, formation of positive and negative ions, dot-cross diagrams for ionic compounds, ionic lattice structure
❌ EXCLUDE: Lattice enthalpy calculations, Born-Haber cycles, polarization of ions
🎯 FOCUS: Students draw dot-cross diagrams and describe ionic bond formation
📝 EXAM TIP: 3-4 marks drawing dot-cross diagrams showing electron transfer in NaCl or MgO' WHERE (title ILIKE '%ionic%' AND (title ILIKE '%bond%' OR title ILIKE '%compound%')) AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%chemistry%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Covalent bonding as electron sharing between non-metals, single/double/triple bonds, dot-cross diagrams for molecules (H₂O, CO₂, CH₄), molecular formulas
❌ EXCLUDE: Dative covalent bonds detail, molecular orbital theory, hybridization
🎯 FOCUS: Students draw dot-cross diagrams showing shared electron pairs
📝 EXAM TIP: 2-3 marks drawing covalent bonding in simple molecules like ammonia or methane' WHERE (title ILIKE '%covalent%' AND title ILIKE '%bond%') AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%chemistry%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Metallic bonding as positive ions in sea of delocalized electrons, explaining conductivity and malleability, structure of metals, alloys and their properties
❌ EXCLUDE: Band theory, work functions, metallic radius trends calculations
🎯 FOCUS: Students explain metal properties using metallic bonding model
📝 EXAM TIP: 3-4 marks explaining why metals conduct electricity using delocalized electrons' WHERE (title ILIKE '%metallic%bond%' OR title ILIKE '%metal%structure%') AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%chemistry%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Diamond structure (tetrahedral, strong covalent bonds), graphite structure (layers, delocalized electrons), silicon dioxide structure, comparing properties
❌ EXCLUDE: Graphene band structure, fullerene chemistry, carbon nanotube applications detail
🎯 FOCUS: Students explain properties of giant covalent structures using bonding
📝 EXAM TIP: 4-6 marks comparing diamond and graphite structures and properties' WHERE (title ILIKE '%diamond%' OR title ILIKE '%graphite%' OR title ILIKE '%giant covalent%' OR title ILIKE '%silicon dioxide%') AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%chemistry%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Properties of ionic compounds (high melting points, conduct when molten/dissolved, brittle), explaining properties using structure and bonding
❌ EXCLUDE: Fajan''s rules, ionic crystal field theory, lattice energy calculations
🎯 FOCUS: Students link ionic compound properties to ionic lattice structure
📝 EXAM TIP: 3-4 marks explaining why ionic compounds have high melting points and conduct when molten' WHERE title ILIKE '%properties%ionic%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%chemistry%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Simple molecular substances (low melting/boiling points, weak intermolecular forces), explaining properties using structure, examples like water and methane
❌ EXCLUDE: Hydrogen bonding quantitative treatment, dipole-dipole calculations, London force equations
🎯 FOCUS: Students explain low melting points using weak intermolecular forces
📝 EXAM TIP: 2-3 marks explaining why simple molecules have low boiling points' WHERE (title ILIKE '%simple molecular%' OR title ILIKE '%molecular%properties%') AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%chemistry%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: States of matter (solid, liquid, gas), particle arrangement and movement, state changes, heating and cooling curves interpretation
❌ EXCLUDE: Phase diagrams detail, critical point, supercritical fluids
🎯 FOCUS: Students describe particle behavior in each state and during changes
📝 EXAM TIP: 2-3 marks describing particle arrangement changes during melting or boiling' WHERE (title ILIKE '%states of matter%' OR title ILIKE '%particle model%' OR title ILIKE '%solid%liquid%gas%') AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%chemistry%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Nanoparticles size range (1-100nm), properties compared to bulk materials (high surface area to volume ratio), uses in sunscreens, catalysts, medicine delivery
❌ EXCLUDE: Quantum dot physics, nanoparticle synthesis methods detail, surface plasmon resonance
🎯 FOCUS: Students calculate surface area to volume ratios and explain nanoparticle properties
📝 EXAM TIP: 3-4 marks calculating surface area:volume ratio and explaining why nanoparticles are effective catalysts' WHERE title ILIKE '%nanoparticle%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%chemistry%'));

-- Chemistry Module 3: Quantitative Chemistry
UPDATE public.course_lessons SET description = '✅ INCLUDE: Relative atomic mass (Ar) definition, relative formula mass (Mr) calculation by adding Ar values, calculating Mr for compounds like H₂SO₄
❌ EXCLUDE: Mass spectrometry fragmentation patterns, isotope peak analysis
🎯 FOCUS: Students calculate Mr from chemical formulas using periodic table values
📝 EXAM TIP: 2-3 mark calculations of Mr for compounds like CaCO₃ or Al₂O₃' WHERE (title ILIKE '%relative%mass%' OR title ILIKE '%formula mass%') AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%chemistry%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Mole as amount of substance, n = m/Mr calculations, converting between mass and moles, Avogadro constant awareness (6.02 × 10²³)
❌ EXCLUDE: Calculations using Avogadro number directly, gas molar volume calculations beyond HT
🎯 FOCUS: Students convert between mass and moles using the formula n = m/Mr
📝 EXAM TIP: 3-4 mark calculations finding moles from mass or vice versa' WHERE (title ILIKE '%mole%' AND (title ILIKE '%calculation%' OR title ILIKE '%mass%')) AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%chemistry%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Balanced equation calculations using mole ratios, limiting reactant concept, reacting mass calculations step by step
❌ EXCLUDE: Excess reactant calculations beyond basic, multi-step industrial calculations
🎯 FOCUS: Students use balanced equations to calculate masses of reactants/products
📝 EXAM TIP: 4-6 mark calculations: mass of one substance → moles → mole ratio → moles of other → mass' WHERE (title ILIKE '%reacting mass%' OR title ILIKE '%equation calculation%' OR title ILIKE '%stoichiometry%') AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%chemistry%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Concentration in g/dm³ and mol/dm³, c = n/V calculations, converting between mass concentration and molar concentration
❌ EXCLUDE: Titration calculations beyond basic, molality, activity coefficients
🎯 FOCUS: Students calculate concentration from moles and volume using c = n/V
📝 EXAM TIP: 3-4 marks converting between g/dm³ and mol/dm³ concentrations' WHERE (title ILIKE '%concentration%' AND NOT title ILIKE '%rate%') AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%chemistry%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Percentage yield definition and calculation (actual/theoretical × 100), reasons for less than 100% yield (incomplete reactions, side reactions, losses)
❌ EXCLUDE: Optimization calculations, industrial yield maximization, economic yield analysis
🎯 FOCUS: Students calculate percentage yield and explain why yields are below 100%
📝 EXAM TIP: 3-4 marks calculating percentage yield given actual and theoretical masses' WHERE title ILIKE '%percentage yield%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%chemistry%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Atom economy definition and calculation (Mr of desired product / Mr of all products × 100), comparing atom economy of different reactions, environmental importance
❌ EXCLUDE: Green chemistry metrics beyond atom economy, E-factor calculations
🎯 FOCUS: Students calculate atom economy and explain why high atom economy is desirable
📝 EXAM TIP: 3-4 marks calculating atom economy and explaining environmental benefits' WHERE title ILIKE '%atom economy%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%chemistry%'));

-- Chemistry Module 4: Chemical Changes
UPDATE public.course_lessons SET description = '✅ INCLUDE: Acids as proton (H⁺) donors, pH scale 0-14, universal indicator colors, strong vs weak acids (complete vs partial ionization), examples of common acids
❌ EXCLUDE: Ka and pKa calculations, buffer solutions, Henderson-Hasselbalch equation
🎯 FOCUS: Students describe acid behavior using proton donor definition and pH scale
📝 EXAM TIP: 2-3 marks identifying acids/bases and explaining pH scale values' WHERE (title ILIKE '%acid%' AND (title ILIKE '%base%' OR title ILIKE '%pH%')) AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%chemistry%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Neutralisation reactions producing salt and water, acid + metal → salt + hydrogen, acid + metal oxide → salt + water, acid + carbonate → salt + water + CO₂
❌ EXCLUDE: Titration curves, buffer calculations, hydrolysis of salts
🎯 FOCUS: Students write word and symbol equations for acid reactions
📝 EXAM TIP: 3-4 marks writing balanced equations for acid + carbonate reactions with observations' WHERE (title ILIKE '%neutralisation%' OR title ILIKE '%neutralization%' OR (title ILIKE '%acid%' AND title ILIKE '%reaction%')) AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%chemistry%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Electrolysis of molten compounds, electrolysis of aqueous solutions, electrode products prediction, extraction of metals (aluminum), electroplating basics
❌ EXCLUDE: Faraday calculations, electrode potentials, electrochemical cells detail
🎯 FOCUS: Students predict electrode products and explain ion movement during electrolysis
📝 EXAM TIP: 4-6 marks predicting and explaining products at each electrode with half equations' WHERE title ILIKE '%electrolysis%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%chemistry%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Reactivity series of metals (K, Na, Ca, Mg, Al, Zn, Fe, Cu, Ag, Au), displacement reactions, extracting metals by reduction with carbon, oxidation and reduction definitions
❌ EXCLUDE: Thermite reaction calculations, Ellingham diagrams, extraction economics
🎯 FOCUS: Students use reactivity series to predict displacement reactions and extraction methods
📝 EXAM TIP: 3-4 marks predicting whether displacement occurs and writing equations' WHERE (title ILIKE '%reactivity series%' OR title ILIKE '%displacement%' OR title ILIKE '%metal extraction%') AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%chemistry%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Oxidation as loss of electrons (OIL RIG), reduction as gain of electrons, identifying oxidation/reduction in reactions, writing ionic equations
❌ EXCLUDE: Oxidation states beyond basic, half equations for complex reactions, redox titrations
🎯 FOCUS: Students identify oxidation and reduction using electron transfer
📝 EXAM TIP: 2-3 marks identifying which species is oxidized/reduced in a reaction using OIL RIG' WHERE (title ILIKE '%oxidation%' OR title ILIKE '%reduction%' OR title ILIKE '%redox%') AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%chemistry%'));

-- Chemistry Module 5: Energy Changes
UPDATE public.course_lessons SET description = '✅ INCLUDE: Exothermic reactions release energy (temperature rises), endothermic reactions absorb energy (temperature falls), examples of each, everyday applications
❌ EXCLUDE: Enthalpy calculations beyond bond energies, Hess''s Law, calorimetry calculations
🎯 FOCUS: Students classify reactions as exothermic or endothermic from temperature changes
📝 EXAM TIP: 2-3 marks identifying reaction type from temperature data and giving examples' WHERE (title ILIKE '%exothermic%' OR title ILIKE '%endothermic%' OR title ILIKE '%energy change%') AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%chemistry%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Bond breaking is endothermic (requires energy), bond making is exothermic (releases energy), calculating overall energy change from bond energies
❌ EXCLUDE: Mean bond enthalpy limitations, enthalpy of atomization, Hess''s Law cycles
🎯 FOCUS: Students calculate energy changes using bond energy values
📝 EXAM TIP: 4-6 marks calculating energy change: bonds broken - bonds made = overall energy' WHERE title ILIKE '%bond energ%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%chemistry%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Reaction profile diagrams showing energy of reactants and products, activation energy as minimum energy needed, effect of catalysts on activation energy
❌ EXCLUDE: Transition state theory, reaction coordinate detail, Arrhenius equation
🎯 FOCUS: Students draw and interpret reaction profiles for exothermic/endothermic reactions
📝 EXAM TIP: 3-4 marks drawing reaction profile labeling activation energy and overall energy change' WHERE (title ILIKE '%reaction profile%' OR title ILIKE '%activation energy%') AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%chemistry%'));

-- Chemistry Module 6: Rate and Extent of Chemical Change
UPDATE public.course_lessons SET description = '✅ INCLUDE: Collision theory - particles must collide with sufficient energy and correct orientation, factors affecting rate (concentration, temperature, surface area, catalysts)
❌ EXCLUDE: Maxwell-Boltzmann distribution calculations, rate equations, order of reaction
🎯 FOCUS: Students explain rate changes using collision theory
📝 EXAM TIP: 4-6 marks explaining why increasing temperature increases rate using collision theory' WHERE (title ILIKE '%collision theory%' OR title ILIKE '%rate%factor%') AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%chemistry%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Measuring rate by gas volume over time, mass loss over time, color change, calculating rate from graphs (gradient), comparing rates
❌ EXCLUDE: Initial rate method, integrated rate equations, half-life calculations for reactions
🎯 FOCUS: Students calculate and compare reaction rates from experimental data
📝 EXAM TIP: 3-4 marks calculating rate from a graph by finding gradient of tangent' WHERE (title ILIKE '%measuring rate%' OR title ILIKE '%rate%experiment%') AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%chemistry%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Catalysts speed up reactions without being used up, lowering activation energy, examples (iron in Haber process, enzymes), catalyst specificity
❌ EXCLUDE: Catalyst mechanisms, homogeneous/heterogeneous catalyst theory, catalyst poisoning chemistry
🎯 FOCUS: Students explain how catalysts work and give industrial examples
📝 EXAM TIP: 2-3 marks explaining catalyst action using activation energy concept' WHERE title ILIKE '%catalyst%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%chemistry%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Reversible reactions shown by ⇌ symbol, equilibrium as dynamic balance, changing position of equilibrium with temperature/pressure/concentration (Le Chatelier''s principle)
❌ EXCLUDE: Equilibrium constant Kc calculations, Kp calculations, quantitative equilibrium problems
🎯 FOCUS: Students predict equilibrium shifts using Le Chatelier''s principle qualitatively
📝 EXAM TIP: 3-4 marks predicting effect of changing conditions on equilibrium position' WHERE (title ILIKE '%equilibrium%' OR title ILIKE '%reversible reaction%') AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%chemistry%'));

-- Chemistry Module 7: Organic Chemistry
UPDATE public.course_lessons SET description = '✅ INCLUDE: Crude oil as mixture of hydrocarbons, fractional distillation separation, uses of fractions (gases, petrol, kerosene, diesel, fuel oil, bitumen), viscosity and flammability trends
❌ EXCLUDE: Cracking mechanisms detail, catalytic reforming, petrochemical industry economics
🎯 FOCUS: Students explain fractional distillation and uses of different fractions
📝 EXAM TIP: 4-6 marks explaining how fractional distillation works and why fractions have different boiling points' WHERE (title ILIKE '%crude oil%' OR title ILIKE '%fractional distillation%' OR title ILIKE '%hydrocarbon%fraction%') AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%chemistry%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Alkanes as saturated hydrocarbons (single bonds only), general formula CₙH₂ₙ₊₂, naming first four alkanes, complete combustion producing CO₂ and H₂O
❌ EXCLUDE: Conformational isomers, free radical substitution mechanism, alkane synthesis
🎯 FOCUS: Students name alkanes and write combustion equations
📝 EXAM TIP: 2-3 marks naming alkanes from structures or writing balanced combustion equations' WHERE title ILIKE '%alkane%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%chemistry%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Cracking breaks long chain alkanes into shorter alkanes and alkenes, thermal cracking (high temperature) and catalytic cracking (zeolite catalyst), products and their uses
❌ EXCLUDE: Cracking reaction mechanisms, catalyst structure, industrial reactor design
🎯 FOCUS: Students explain why cracking is needed and what products form
📝 EXAM TIP: 3-4 marks explaining cracking conditions and why it produces more useful products' WHERE title ILIKE '%cracking%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%chemistry%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Alkenes as unsaturated hydrocarbons (C=C double bond), general formula CₙH₂ₙ, test for unsaturation (bromine water decolorizes), addition reactions with hydrogen, water, halogens
❌ EXCLUDE: Electrophilic addition mechanisms, Markovnikov''s rule, stereoisomerism
🎯 FOCUS: Students identify alkenes and describe their reactions
📝 EXAM TIP: 3-4 marks describing bromine water test and explaining addition reaction products' WHERE title ILIKE '%alkene%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%chemistry%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Alcohols functional group (-OH), naming methanol/ethanol/propanol/butanol, production by fermentation and hydration, uses as solvents and fuels, combustion and oxidation
❌ EXCLUDE: Alcohol oxidation mechanisms, esterification equilibrium calculations, primary/secondary/tertiary classification detail
🎯 FOCUS: Students name alcohols and describe their production and reactions
📝 EXAM TIP: 3-4 marks describing fermentation conditions and ethanol production' WHERE title ILIKE '%alcohol%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%chemistry%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Carboxylic acids functional group (-COOH), naming methanoic/ethanoic/propanoic acid, weak acid properties, reactions with carbonates and alcohols (esterification)
❌ EXCLUDE: Acid dissociation constants, carboxylic acid derivatives, reduction reactions
🎯 FOCUS: Students name carboxylic acids and describe their acidic properties
📝 EXAM TIP: 2-3 marks identifying carboxylic acids and writing equations for their reactions' WHERE title ILIKE '%carboxylic acid%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%chemistry%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Addition polymers from alkenes (polythene, polypropene, PVC), condensation polymers (polyesters, proteins basics), monomer to polymer diagrams, uses and disposal issues
❌ EXCLUDE: Polymer stereochemistry, copolymer calculations, polymer degradation chemistry
🎯 FOCUS: Students draw monomer structures from polymers and vice versa
📝 EXAM TIP: 3-4 marks drawing polymer structure from monomer or identifying monomer from polymer' WHERE title ILIKE '%polymer%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%chemistry%'));

-- Chemistry Module 8: Chemical Analysis
UPDATE public.course_lessons SET description = '✅ INCLUDE: Pure substances have sharp melting/boiling points, impurities broaden melting range and lower melting point, formulations as mixtures with specific compositions
❌ EXCLUDE: Colligative properties calculations, phase diagrams, eutectic mixtures
🎯 FOCUS: Students use melting point data to determine purity
📝 EXAM TIP: 2-3 marks explaining how melting point indicates purity of a substance' WHERE (title ILIKE '%pure substance%' OR title ILIKE '%purity%' OR title ILIKE '%formulation%') AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%chemistry%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Flame tests for Li⁺ (red), Na⁺ (yellow), K⁺ (lilac), Ca²⁺ (orange-red), Cu²⁺ (green), metal hydroxide precipitate colors, carbonate test with acid
❌ EXCLUDE: Atomic emission spectroscopy, colorimetry calculations, qualitative analysis beyond specification
🎯 FOCUS: Students identify metal ions using flame tests and precipitate tests
📝 EXAM TIP: 2-3 marks identifying metal ions from flame color or precipitate color' WHERE (title ILIKE '%flame test%' OR title ILIKE '%test%metal%ion%' OR title ILIKE '%precipitate%test%') AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%chemistry%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Tests for H₂ (squeaky pop), O₂ (relights glowing splint), CO₂ (limewater turns milky), Cl₂ (bleaches damp litmus), test for water (anhydrous copper sulfate turns blue)
❌ EXCLUDE: Gas detection sensors, volumetric gas analysis, mass spectrometry for gases
🎯 FOCUS: Students describe and explain tests for common gases
📝 EXAM TIP: 2-3 marks describing test for specific gas with expected observation' WHERE (title ILIKE '%test%gas%' OR title ILIKE '%hydrogen test%' OR title ILIKE '%oxygen test%' OR title ILIKE '%carbon dioxide test%') AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%chemistry%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Paper chromatography setup and method, Rf value calculation (distance moved by substance / distance moved by solvent), using Rf values to identify substances
❌ EXCLUDE: HPLC, gas chromatography, two-way chromatography, chromatography-mass spectrometry coupling
🎯 FOCUS: Students calculate Rf values and interpret chromatograms
📝 EXAM TIP: 3-4 marks calculating Rf value and using it to identify unknown substance' WHERE title ILIKE '%chromatography%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%chemistry%'));

-- Chemistry Module 9: Chemistry of the Atmosphere
UPDATE public.course_lessons SET description = '✅ INCLUDE: Current atmosphere composition (78% N₂, 21% O₂, 0.04% CO₂, variable water vapor), how atmosphere evolved over billions of years, role of plants in producing oxygen
❌ EXCLUDE: Atmospheric chemistry mechanisms, ozone layer chemistry detail, isotope dating of atmosphere
🎯 FOCUS: Students describe atmosphere composition and explain its evolution
📝 EXAM TIP: 3-4 marks explaining how early atmosphere changed to current composition' WHERE (title ILIKE '%atmosphere%composition%' OR title ILIKE '%atmosphere%evolution%') AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%chemistry%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Greenhouse gases (CO₂, CH₄, water vapor), greenhouse effect mechanism, evidence for climate change, human activities increasing CO₂ levels
❌ EXCLUDE: Radiative forcing calculations, climate modeling, global warming potentials detail
🎯 FOCUS: Students explain greenhouse effect and link human activities to climate change
📝 EXAM TIP: 4-6 marks explaining greenhouse effect and evaluating evidence for human-caused climate change' WHERE (title ILIKE '%greenhouse%' OR title ILIKE '%climate change%') AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%chemistry%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Carbon footprint definition and reduction methods, pollutants from burning fuels (CO, SO₂, NOₓ, particulates), acid rain formation and effects
❌ EXCLUDE: Life cycle assessment calculations, carbon trading economics, atmospheric reaction kinetics
🎯 FOCUS: Students describe pollutant formation and environmental impacts
📝 EXAM TIP: 3-4 marks explaining how pollutants form and their environmental effects' WHERE (title ILIKE '%carbon footprint%' OR title ILIKE '%pollutant%' OR title ILIKE '%acid rain%') AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%chemistry%'));

-- Chemistry Module 10: Using Resources
UPDATE public.course_lessons SET description = '✅ INCLUDE: Finite vs renewable resources, sustainable development concept, extracting metals from ores, recycling metals (economic and environmental benefits)
❌ EXCLUDE: Mining economics, ore grade calculations, extraction plant design
🎯 FOCUS: Students compare sustainability of different resource uses
📝 EXAM TIP: 3-4 marks comparing advantages of recycling vs extracting new metal' WHERE (title ILIKE '%resource%' AND (title ILIKE '%finite%' OR title ILIKE '%renewable%' OR title ILIKE '%sustainable%')) AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%chemistry%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Life cycle assessment stages (raw materials, manufacture, use, disposal), comparing LCAs of products, limitations of LCA data interpretation
❌ EXCLUDE: Quantitative LCA calculations, environmental impact scoring systems, ISO standards
🎯 FOCUS: Students describe LCA stages and interpret comparative LCAs
📝 EXAM TIP: 4-6 marks comparing LCAs of two products and evaluating environmental impacts' WHERE title ILIKE '%life cycle assessment%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%chemistry%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Potable water requirements, water treatment steps (sedimentation, filtration, chlorination), desalination methods (distillation, reverse osmosis), wastewater treatment basics
❌ EXCLUDE: Water quality calculations, membrane technology detail, sewage treatment chemistry
🎯 FOCUS: Students describe water treatment processes and explain their purpose
📝 EXAM TIP: 3-4 marks explaining steps in making water potable from a given source' WHERE (title ILIKE '%water treatment%' OR title ILIKE '%potable water%' OR title ILIKE '%desalination%') AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%chemistry%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Haber process conditions (450°C, 200 atm, iron catalyst), compromise conditions explanation (rate vs yield), reversible reaction equilibrium, NPK fertilizers composition
❌ EXCLUDE: Kp calculations for Haber process, industrial plant economics, catalyst degradation
🎯 FOCUS: Students explain Haber process conditions as a compromise
📝 EXAM TIP: 4-6 marks explaining why specific temperature and pressure are used in Haber process' WHERE (title ILIKE '%haber process%' OR title ILIKE '%ammonia production%' OR title ILIKE '%fertiliser%' OR title ILIKE '%fertilizer%') AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%chemistry%'));