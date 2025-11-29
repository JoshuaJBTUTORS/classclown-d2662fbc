-- Physics Module 1: Energy
UPDATE public.course_lessons SET description = '✅ INCLUDE: Energy stores (kinetic, gravitational potential, elastic potential, thermal, chemical, magnetic, electrostatic, nuclear), energy transfers between stores
❌ EXCLUDE: Detailed thermodynamics, entropy, Gibbs free energy, statistical mechanics
🎯 FOCUS: Students identify energy stores and describe transfers between them
📝 EXAM TIP: 2-3 marks identifying energy stores in given scenarios and describing transfers' WHERE (title ILIKE '%energy store%' OR title ILIKE '%energy transfer%') AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%physics%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Work done = force × distance (W = Fd), work done as energy transferred, calculating work done against gravity and friction
❌ EXCLUDE: Work-energy theorem derivations, path-dependent work calculations, variable force work
🎯 FOCUS: Students calculate work done using W = Fd in straightforward scenarios
📝 EXAM TIP: 3-4 marks calculating work done with clear force and distance values' WHERE title ILIKE '%work done%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%physics%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Kinetic energy = ½mv², gravitational potential energy = mgh, calculating and comparing KE and GPE, energy conservation in falling objects
❌ EXCLUDE: Relativistic kinetic energy, variable g calculations, rotational kinetic energy
🎯 FOCUS: Students calculate KE and GPE and apply conservation of energy
📝 EXAM TIP: 4-6 marks calculating initial/final energies and using conservation principle' WHERE (title ILIKE '%kinetic energy%' OR title ILIKE '%gravitational potential%' OR title ILIKE '%GPE%' OR title ILIKE '%KE%') AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%physics%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Elastic potential energy = ½ke², spring constant k, calculating energy stored in stretched springs, limits of proportionality
❌ EXCLUDE: Non-linear springs, strain energy in materials, elastic modulus calculations
🎯 FOCUS: Students calculate elastic PE using the formula with spring constant
📝 EXAM TIP: 3-4 marks calculating elastic potential energy given extension and spring constant' WHERE (title ILIKE '%elastic%' AND (title ILIKE '%energy%' OR title ILIKE '%spring%')) AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%physics%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Specific heat capacity definition (energy to raise 1kg by 1°C), E = mcΔT calculations, practical determination of SHC
❌ EXCLUDE: Molar heat capacity, phase diagrams, latent heat during temperature change
🎯 FOCUS: Students calculate energy for temperature changes using E = mcΔT
📝 EXAM TIP: 4-6 marks calculating energy or temperature change using E = mcΔT' WHERE (title ILIKE '%specific heat capacity%' OR title ILIKE '%SHC%') AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%physics%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Power as rate of energy transfer (P = E/t), power in terms of work done (P = W/t), units of power (watts), calculating power in everyday contexts
❌ EXCLUDE: Power factor, reactive power, instantaneous vs average power distinctions
🎯 FOCUS: Students calculate power from energy and time using P = E/t
📝 EXAM TIP: 2-3 marks calculating power or energy given other values' WHERE title ILIKE '%power%' AND title NOT ILIKE '%nuclear%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%physics%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Efficiency = useful output / total input × 100%, calculating efficiency from energy or power values, reducing energy waste, improving efficiency
❌ EXCLUDE: Carnot efficiency, thermodynamic efficiency limits, exergy analysis
🎯 FOCUS: Students calculate efficiency and suggest ways to improve it
📝 EXAM TIP: 3-4 marks calculating efficiency and explaining why it cannot be 100%' WHERE title ILIKE '%efficiency%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%physics%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Conservation of energy principle (energy cannot be created or destroyed), energy dissipation to surroundings, closed systems, Sankey diagrams basics
❌ EXCLUDE: First law of thermodynamics formal statement, internal energy detailed treatment
🎯 FOCUS: Students apply conservation of energy and interpret Sankey diagrams
📝 EXAM TIP: 2-3 marks explaining conservation of energy in given scenarios' WHERE (title ILIKE '%conservation%energy%' OR title ILIKE '%sankey%' OR title ILIKE '%energy dissipation%') AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%physics%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Renewable vs non-renewable energy sources, fossil fuels, nuclear, solar, wind, hydroelectric, geothermal, advantages and disadvantages of each
❌ EXCLUDE: Power station efficiency calculations, grid balancing, energy economics detail
🎯 FOCUS: Students compare energy resources and evaluate their advantages/disadvantages
📝 EXAM TIP: 4-6 marks comparing two energy sources with advantages and disadvantages' WHERE (title ILIKE '%energy resource%' OR title ILIKE '%renewable%' OR title ILIKE '%fossil fuel%' OR title ILIKE '%nuclear power%') AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%physics%'));

-- Physics Module 2: Electricity
UPDATE public.course_lessons SET description = '✅ INCLUDE: Current as rate of flow of charge (I = Q/t), potential difference as energy per unit charge (V = E/Q), resistance as opposition to current flow (R = V/I)
❌ EXCLUDE: Drift velocity derivations, microscopic current theory, conductivity tensor
🎯 FOCUS: Students define and calculate current, voltage, and resistance
📝 EXAM TIP: 2-3 marks using I = Q/t or V = IR for straightforward calculations' WHERE (title ILIKE '%current%' OR title ILIKE '%voltage%' OR title ILIKE '%potential difference%') AND title NOT ILIKE '%characteristic%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%physics%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Ohm''s Law (V = IR), calculating resistance, current, or voltage, recognizing ohmic conductors from I-V graphs
❌ EXCLUDE: Temperature coefficient of resistance, superconductivity, non-ohmic detailed analysis
🎯 FOCUS: Students apply V = IR in circuit calculations
📝 EXAM TIP: 3-4 marks rearranging and applying V = IR in various scenarios' WHERE title ILIKE '%ohm%law%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%physics%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Circuit symbols (cell, battery, resistor, variable resistor, lamp, switch, ammeter, voltmeter, LED, LDR, thermistor), drawing and interpreting circuit diagrams
❌ EXCLUDE: Complex integrated circuit symbols, logic gate symbols, transformer symbols detail
🎯 FOCUS: Students draw and interpret circuit diagrams using standard symbols
📝 EXAM TIP: 1-2 marks identifying symbols or completing circuit diagrams' WHERE (title ILIKE '%circuit symbol%' OR title ILIKE '%circuit diagram%') AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%physics%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Series circuits (same current throughout, voltages add, resistances add), parallel circuits (same voltage, currents add, 1/R total calculation)
❌ EXCLUDE: Complex network analysis, Kirchhoff''s laws formal treatment, Wheatstone bridge
🎯 FOCUS: Students calculate current, voltage, and resistance in series and parallel circuits
📝 EXAM TIP: 4-6 marks calculating values in combined series-parallel circuits' WHERE (title ILIKE '%series%' OR title ILIKE '%parallel%') AND title ILIKE '%circuit%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%physics%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: I-V characteristics for resistors (straight line through origin), filament lamps (curved), diodes (forward bias only), LDRs and thermistors (qualitative)
❌ EXCLUDE: Semiconductor physics, band theory, detailed diode characteristics
🎯 FOCUS: Students sketch and interpret I-V graphs for different components
📝 EXAM TIP: 3-4 marks sketching I-V characteristics and explaining component behavior' WHERE (title ILIKE '%I-V%' OR title ILIKE '%characteristic%' OR (title ILIKE '%filament%' AND title ILIKE '%lamp%')) AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%physics%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: LDR resistance decreases with increasing light intensity, thermistor resistance decreases with increasing temperature, applications in circuits
❌ EXCLUDE: Semiconductor physics, photoconductivity theory, NTC vs PTC thermistors detail
🎯 FOCUS: Students describe how LDR and thermistor resistance changes and their applications
📝 EXAM TIP: 2-3 marks explaining how circuit behavior changes with light/temperature' WHERE (title ILIKE '%LDR%' OR title ILIKE '%thermistor%' OR title ILIKE '%light dependent%') AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%physics%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Electrical power P = IV, P = I²R, P = V²/R, calculating power dissipated in resistors, power ratings of appliances
❌ EXCLUDE: Power factor correction, reactive power, three-phase power calculations
🎯 FOCUS: Students calculate power using appropriate formula for given values
📝 EXAM TIP: 3-4 marks choosing correct power formula and calculating power' WHERE title ILIKE '%electrical power%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%physics%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Energy transferred E = Pt, E = QV, E = VIt, calculating energy transferred in circuits, kilowatt-hours, electricity bills
❌ EXCLUDE: Energy storage in capacitors, electromagnetic energy, power station efficiency
🎯 FOCUS: Students calculate energy transferred and cost of electricity
📝 EXAM TIP: 3-4 marks calculating energy in joules or kWh and electricity costs' WHERE (title ILIKE '%energy%' AND title ILIKE '%circuit%') OR title ILIKE '%kilowatt%hour%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%physics%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: AC vs DC (alternating vs direct current), mains supply (230V, 50Hz UK), live, neutral, and earth wires functions, safety features (fuses, circuit breakers, earthing)
❌ EXCLUDE: AC phase relationships, RMS calculations, power factor, three-phase supply
🎯 FOCUS: Students explain mains electricity safety features and wire functions
📝 EXAM TIP: 3-4 marks explaining why earthing and fuses are needed for safety' WHERE (title ILIKE '%mains%' OR title ILIKE '%AC%DC%' OR (title ILIKE '%live%' AND title ILIKE '%neutral%') OR title ILIKE '%fuse%' OR title ILIKE '%earth%wire%') AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%physics%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: National Grid structure, step-up and step-down transformers, why high voltage transmission reduces energy losses (P = I²R), transformer equation Vp/Vs = Np/Ns
❌ EXCLUDE: Transformer efficiency calculations beyond basic, grid stability, smart grid technology
🎯 FOCUS: Students explain how National Grid transmits electricity efficiently
📝 EXAM TIP: 4-6 marks explaining why high voltage reduces losses using P = I²R' WHERE (title ILIKE '%national grid%' OR title ILIKE '%transformer%') AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%physics%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Static electricity from friction (electron transfer), attraction and repulsion of charges, charging by induction, uses (photocopiers, paint sprayers) and dangers (sparks)
❌ EXCLUDE: Coulomb''s law calculations, electric field calculations, capacitance
🎯 FOCUS: Students explain charging by friction and applications of static electricity
📝 EXAM TIP: 3-4 marks explaining how objects become charged and attract/repel' WHERE title ILIKE '%static%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%physics%'));

-- Physics Module 3: Particle Model of Matter
UPDATE public.course_lessons SET description = '✅ INCLUDE: Density = mass/volume (ρ = m/V), calculating density, measuring density of regular and irregular solids, floating and sinking
❌ EXCLUDE: Relative density, pressure-density relationships in fluids, buoyancy calculations
🎯 FOCUS: Students calculate density and describe how to measure it experimentally
📝 EXAM TIP: 3-4 marks calculating density or describing the practical method' WHERE title ILIKE '%density%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%physics%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Particle arrangement in solids (fixed, vibrating), liquids (close, moving), gases (far apart, fast random motion), explaining properties using particle model
❌ EXCLUDE: Molecular dynamics, intermolecular forces detail, crystallography
🎯 FOCUS: Students describe particle behavior and link to macroscopic properties
📝 EXAM TIP: 2-3 marks describing particle arrangement and movement in each state' WHERE (title ILIKE '%states of matter%' OR title ILIKE '%particle model%' OR (title ILIKE '%solid%' AND title ILIKE '%liquid%' AND title ILIKE '%gas%')) AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%physics%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Internal energy as sum of kinetic and potential energies of particles, changes during heating (increased KE) and state changes (increased PE), temperature and average KE
❌ EXCLUDE: Statistical mechanics, Maxwell-Boltzmann distribution, thermodynamic potentials
🎯 FOCUS: Students explain internal energy changes during heating and state changes
📝 EXAM TIP: 2-3 marks explaining why temperature stays constant during melting' WHERE title ILIKE '%internal energy%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%physics%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Specific latent heat definition (energy to change state of 1kg without temperature change), E = mL calculations, latent heat of fusion vs vaporization
❌ EXCLUDE: Clausius-Clapeyron equation, triple point, supercooling/superheating
🎯 FOCUS: Students calculate energy for state changes using E = mL
📝 EXAM TIP: 3-4 marks calculating energy to melt or boil a given mass' WHERE (title ILIKE '%latent heat%' OR title ILIKE '%specific latent%') AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%physics%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Gas pressure from particle collisions with container walls, pressure-volume relationship at constant temperature (p₁V₁ = p₂V₂), explaining pressure changes using particle model
❌ EXCLUDE: Ideal gas equation pV = nRT, real gas behavior, kinetic theory derivations
🎯 FOCUS: Students apply p₁V₁ = p₂V₂ and explain using particle collisions
📝 EXAM TIP: 3-4 marks calculating new pressure or volume and explaining using particles' WHERE (title ILIKE '%gas pressure%' OR title ILIKE '%pressure%volume%' OR title ILIKE '%gas law%') AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%physics%'));

-- Physics Module 4: Atomic Structure
UPDATE public.course_lessons SET description = '✅ INCLUDE: Atom structure (protons and neutrons in nucleus, electrons in shells), atomic number, mass number, calculating numbers of subatomic particles
❌ EXCLUDE: Quantum numbers, electron orbitals (s,p,d,f), nuclear shell model
🎯 FOCUS: Students describe atomic structure and calculate particle numbers
📝 EXAM TIP: 2-3 marks calculating protons, neutrons, electrons from atomic notation' WHERE title ILIKE '%atom%structure%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%physics%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Isotopes as atoms with same protons but different neutrons, ions as atoms that have gained or lost electrons, examples and uses
❌ EXCLUDE: Mass spectrometry, isotope separation, nuclear isomers
🎯 FOCUS: Students identify isotopes and ions from atomic data
📝 EXAM TIP: 2 marks identifying isotopes or explaining what makes them different' WHERE (title ILIKE '%isotope%' OR title ILIKE '%ion%') AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%physics%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Alpha decay (helium nucleus emitted, mass decreases by 4, atomic number by 2), beta decay (neutron → proton + electron, atomic number increases by 1), gamma decay (no particle change)
❌ EXCLUDE: Beta plus decay, electron capture, detailed decay mechanisms, neutrinos
🎯 FOCUS: Students write nuclear equations for alpha and beta decay
📝 EXAM TIP: 3-4 marks writing decay equations and identifying products' WHERE (title ILIKE '%radioactive decay%' OR title ILIKE '%alpha decay%' OR title ILIKE '%beta decay%' OR title ILIKE '%gamma%') AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%physics%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Properties of alpha (stopped by paper, high ionizing), beta (stopped by aluminum, medium ionizing), gamma (stopped by lead/concrete, low ionizing), penetrating power and ionizing ability
❌ EXCLUDE: Radiation dosimetry calculations, relative biological effectiveness, radiation weighting factors
🎯 FOCUS: Students compare properties and explain different penetrating abilities
📝 EXAM TIP: 3-4 marks comparing alpha, beta, gamma properties using a table' WHERE (title ILIKE '%alpha%beta%gamma%' OR title ILIKE '%radiation%properties%' OR title ILIKE '%ionizing%' OR title ILIKE '%penetrating%') AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%physics%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Half-life definition (time for half of nuclei to decay), calculating remaining activity or mass after given time, half-life graphs
❌ EXCLUDE: Decay constant λ, exponential decay equations, radioactive dating calculations beyond simple
🎯 FOCUS: Students calculate remaining amount after multiple half-lives
📝 EXAM TIP: 3-4 marks calculating remaining fraction or activity after given half-lives' WHERE title ILIKE '%half-life%' OR title ILIKE '%half life%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%physics%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Random nature of radioactive decay, count rate variation, background radiation sources (radon, cosmic, medical, food), measuring count rate
❌ EXCLUDE: Poisson statistics, decay probability, detector efficiency calculations
🎯 FOCUS: Students explain randomness of decay and identify background sources
📝 EXAM TIP: 2-3 marks explaining why count rate varies and naming background sources' WHERE (title ILIKE '%background radiation%' OR title ILIKE '%radioactive%random%' OR title ILIKE '%count rate%') AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%physics%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Uses of radiation (medical tracers, treating cancer, smoke detectors, thickness monitoring), dangers (cell damage, cancer risk), safety precautions
❌ EXCLUDE: Radiation dose calculations, effective dose, radiation protection calculations
🎯 FOCUS: Students explain uses and safety precautions for handling radioactive sources
📝 EXAM TIP: 3-4 marks explaining a use and how risks are minimized' WHERE (title ILIKE '%radiation%use%' OR title ILIKE '%radiation%danger%' OR title ILIKE '%radiation%safety%') AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%physics%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Nuclear fission (heavy nucleus splits into two smaller nuclei plus neutrons), chain reactions, nuclear reactors basics, control rods and moderators
❌ EXCLUDE: Reactor physics calculations, neutron cross-sections, criticality calculations
🎯 FOCUS: Students describe fission process and how reactors are controlled
📝 EXAM TIP: 4-6 marks explaining chain reaction and role of control rods' WHERE title ILIKE '%fission%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%physics%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Nuclear fusion (light nuclei join to form heavier nucleus), conditions needed (high temperature and pressure), fusion in stars, why fusion is difficult on Earth
❌ EXCLUDE: Fusion cross-sections, plasma physics, tokamak design, Lawson criterion
🎯 FOCUS: Students describe fusion process and why it is difficult to achieve
📝 EXAM TIP: 3-4 marks comparing fission and fusion with advantages/disadvantages' WHERE title ILIKE '%fusion%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%physics%'));

-- Physics Module 5: Forces
UPDATE public.course_lessons SET description = '✅ INCLUDE: Scalar quantities (magnitude only: speed, distance, mass, temperature), vector quantities (magnitude and direction: velocity, displacement, force, acceleration)
❌ EXCLUDE: Vector components in 3D, tensor quantities, vector calculus
🎯 FOCUS: Students classify quantities as scalar or vector and explain difference
📝 EXAM TIP: 1-2 marks identifying scalars and vectors from a list' WHERE (title ILIKE '%scalar%' OR title ILIKE '%vector%') AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%physics%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Contact forces (friction, air resistance, tension, normal contact), non-contact forces (gravitational, magnetic, electrostatic), examples and applications
❌ EXCLUDE: Detailed force field theory, inverse square law derivations, field strength calculations
🎯 FOCUS: Students identify and classify forces in given scenarios
📝 EXAM TIP: 2-3 marks identifying forces acting on objects and classifying them' WHERE (title ILIKE '%contact%force%' OR title ILIKE '%non-contact%force%' OR title ILIKE '%types of force%') AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%physics%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Weight = mass × gravitational field strength (W = mg), g ≈ 10 N/kg on Earth, weight vs mass distinction, measuring weight using newton meter
❌ EXCLUDE: Variation of g with altitude, gravitational potential, orbital mechanics
🎯 FOCUS: Students calculate weight and distinguish it from mass
📝 EXAM TIP: 2-3 marks calculating weight and explaining mass vs weight difference' WHERE title ILIKE '%weight%' AND title NOT ILIKE '%atomic%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%physics%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Resultant force as single force with same effect as all forces combined, adding forces in same/opposite directions, balanced forces (resultant = 0)
❌ EXCLUDE: Vector addition using components, resolution of forces in multiple directions
🎯 FOCUS: Students calculate resultant force for forces in one dimension
📝 EXAM TIP: 2-3 marks calculating resultant force from multiple forces' WHERE title ILIKE '%resultant%force%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%physics%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Free body diagrams showing all forces on an object, force arrows (length represents magnitude, direction shown), identifying all forces in scenarios
❌ EXCLUDE: Advanced force diagrams with components, multiple body systems, constraint forces
🎯 FOCUS: Students draw and interpret free body diagrams
📝 EXAM TIP: 2-3 marks drawing free body diagram with correctly labeled forces' WHERE title ILIKE '%free body%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%physics%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Hooke''s Law F = kx (force proportional to extension), spring constant k, elastic limit, elastic vs inelastic deformation, practical investigation
❌ EXCLUDE: Stress-strain curves, Young''s modulus, material testing beyond basic
🎯 FOCUS: Students apply F = kx and describe spring behavior
📝 EXAM TIP: 3-4 marks calculating force, extension, or spring constant using F = kx' WHERE (title ILIKE '%hooke%law%' OR title ILIKE '%spring%' OR title ILIKE '%elastic%') AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%physics%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Moment = force × perpendicular distance from pivot (M = Fd), principle of moments (sum of clockwise = sum of anticlockwise for equilibrium), levers and gears
❌ EXCLUDE: Couples and torque vectors, center of mass calculations, structural mechanics
🎯 FOCUS: Students calculate moments and apply principle of moments
📝 EXAM TIP: 4-6 marks calculating unknown force or distance using principle of moments' WHERE (title ILIKE '%moment%' OR title ILIKE '%lever%' OR title ILIKE '%pivot%') AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%physics%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Speed = distance/time, velocity = displacement/time, typical speeds (walking 1.5 m/s, car 25 m/s, sound 330 m/s), measuring speed practically
❌ EXCLUDE: Instantaneous vs average velocity derivations, relative velocity in 2D
🎯 FOCUS: Students calculate speed and velocity and know typical values
📝 EXAM TIP: 2-3 marks calculating speed or time from distance data' WHERE (title ILIKE '%speed%' OR title ILIKE '%velocity%') AND title NOT ILIKE '%graph%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%physics%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Acceleration = change in velocity / time (a = Δv/t), units m/s², deceleration as negative acceleration, uniform acceleration
❌ EXCLUDE: Non-uniform acceleration, jerk, acceleration as derivative of velocity
🎯 FOCUS: Students calculate acceleration from velocity and time data
📝 EXAM TIP: 2-3 marks calculating acceleration given initial/final velocity and time' WHERE title ILIKE '%acceleration%' AND title NOT ILIKE '%graph%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%physics%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Distance-time graphs (gradient = speed, horizontal = stationary), velocity-time graphs (gradient = acceleration, area = distance), interpreting and sketching graphs
❌ EXCLUDE: Displacement-time graphs with calculus, graphical integration methods
🎯 FOCUS: Students interpret and draw motion graphs, calculate gradient and area
📝 EXAM TIP: 4-6 marks interpreting graph features and calculating speed/distance/acceleration' WHERE (title ILIKE '%distance-time%' OR title ILIKE '%velocity-time%' OR title ILIKE '%motion graph%') AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%physics%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: SUVAT equations (v = u + at, s = ut + ½at², v² = u² + 2as, s = ½(u+v)t), applying to uniform acceleration problems
❌ EXCLUDE: Derivation of equations, projectile motion in 2D, non-uniform acceleration
🎯 FOCUS: Students select and apply appropriate suvat equation for given problem
📝 EXAM TIP: 4-6 marks selecting correct equation and calculating unknown quantity' WHERE (title ILIKE '%suvat%' OR title ILIKE '%equation%motion%' OR title ILIKE '%uniform acceleration%') AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%physics%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Newton''s first law (object remains at rest or constant velocity unless acted on by resultant force), inertia concept
❌ EXCLUDE: Inertial reference frames, non-inertial forces, Galilean relativity
🎯 FOCUS: Students explain motion using Newton''s first law
📝 EXAM TIP: 2-3 marks explaining why object continues moving or stays stationary' WHERE title ILIKE '%newton%first%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%physics%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Newton''s second law F = ma, calculating force, mass, or acceleration, resultant force and acceleration relationship
❌ EXCLUDE: Variable mass systems, rocket equation, impulse-momentum detailed treatment
🎯 FOCUS: Students apply F = ma to calculate unknown quantities
📝 EXAM TIP: 3-4 marks calculating force, mass, or acceleration using F = ma' WHERE title ILIKE '%newton%second%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%physics%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Newton''s third law (equal and opposite reaction forces), identifying action-reaction pairs, why pairs act on different objects
❌ EXCLUDE: Application to complex systems, internal vs external forces analysis
🎯 FOCUS: Students identify action-reaction pairs and explain why they don''t cancel
📝 EXAM TIP: 2-3 marks identifying the reaction force and explaining Newton''s third law' WHERE title ILIKE '%newton%third%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%physics%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Thinking distance (reaction time × speed), braking distance (depends on speed, road conditions, brake condition), stopping distance = thinking + braking
❌ EXCLUDE: Detailed friction coefficient calculations, ABS physics, vehicle dynamics
🎯 FOCUS: Students explain factors affecting stopping distance
📝 EXAM TIP: 3-4 marks explaining how factors affect thinking and braking distances' WHERE title ILIKE '%stopping distance%' OR title ILIKE '%braking distance%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%physics%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Momentum = mass × velocity (p = mv), conservation of momentum in collisions, calculating momentum before and after collisions
❌ EXCLUDE: 2D momentum problems, center of mass velocity, coefficient of restitution
🎯 FOCUS: Students apply conservation of momentum to collision problems
📝 EXAM TIP: 4-6 marks using conservation of momentum to find velocity after collision' WHERE title ILIKE '%momentum%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%physics%'));

-- Physics Module 6: Waves
UPDATE public.course_lessons SET description = '✅ INCLUDE: Transverse waves (oscillation perpendicular to direction: light, water), longitudinal waves (oscillation parallel: sound), comparing wave types
❌ EXCLUDE: Polarization beyond basic, seismic wave analysis, wave mechanics
🎯 FOCUS: Students describe and distinguish transverse and longitudinal waves
📝 EXAM TIP: 2-3 marks describing oscillation direction and giving examples' WHERE (title ILIKE '%transverse%' OR title ILIKE '%longitudinal%' OR title ILIKE '%wave type%') AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%physics%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Wave equation v = fλ, frequency (Hz), wavelength (m), wave speed (m/s), amplitude, period, calculating using wave equation
❌ EXCLUDE: Wave number, angular frequency, complex wave notation
🎯 FOCUS: Students apply v = fλ to calculate wave properties
📝 EXAM TIP: 3-4 marks calculating frequency, wavelength, or wave speed' WHERE (title ILIKE '%wave equation%' OR title ILIKE '%wavelength%' OR title ILIKE '%frequency%' OR title ILIKE '%wave speed%') AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%physics%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Reflection (angle of incidence = angle of reflection), refraction (change of direction at boundary, speed change), practical investigations
❌ EXCLUDE: Snell''s law calculations, critical angle calculations, total internal reflection beyond basic
🎯 FOCUS: Students describe reflection and refraction and draw ray diagrams
📝 EXAM TIP: 2-3 marks drawing ray diagrams for reflection or refraction' WHERE (title ILIKE '%reflection%' OR title ILIKE '%refraction%') AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%physics%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Sound waves as longitudinal waves, speed of sound in different media, hearing range (20Hz-20kHz), echoes and ultrasound uses
❌ EXCLUDE: Sound intensity calculations, decibel scale calculations, acoustic impedance
🎯 FOCUS: Students describe sound wave properties and ultrasound applications
📝 EXAM TIP: 2-3 marks explaining how ultrasound is used in medicine or industry' WHERE title ILIKE '%sound%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%physics%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Electromagnetic spectrum order (radio, microwave, infrared, visible, UV, X-ray, gamma), properties of each type, uses and dangers
❌ EXCLUDE: Photon energy calculations, emission spectra, quantum properties of light
🎯 FOCUS: Students describe EM spectrum order, properties, uses, and dangers
📝 EXAM TIP: 3-4 marks describing properties and uses of specific EM radiation type' WHERE (title ILIKE '%electromagnetic%' OR title ILIKE '%EM spectrum%' OR title ILIKE '%radio wave%' OR title ILIKE '%microwave%' OR title ILIKE '%infrared%' OR title ILIKE '%ultraviolet%' OR title ILIKE '%x-ray%') AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%physics%'));

-- Physics Module 7: Magnetism and Electromagnetism
UPDATE public.course_lessons SET description = '✅ INCLUDE: Magnetic field patterns around bar magnets, field lines from N to S, attraction and repulsion, plotting field lines with compasses, Earth''s magnetic field
❌ EXCLUDE: Magnetic field calculations, magnetic flux density, vector field theory
🎯 FOCUS: Students draw field patterns and describe magnetic forces
📝 EXAM TIP: 2-3 marks drawing field lines around bar magnets or between poles' WHERE (title ILIKE '%magnetic field%' OR title ILIKE '%bar magnet%' OR title ILIKE '%magnet%') AND title NOT ILIKE '%electro%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%physics%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Electromagnets (current in coil creates magnetic field), factors affecting strength (current, number of turns, iron core), uses (scrapyard crane, circuit breakers)
❌ EXCLUDE: Magnetic permeability, hysteresis, electromagnet design calculations
🎯 FOCUS: Students explain how electromagnets work and how to make them stronger
📝 EXAM TIP: 3-4 marks explaining factors affecting electromagnet strength' WHERE title ILIKE '%electromagnet%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%physics%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Motor effect (force on current-carrying wire in magnetic field), F = BIL, Fleming''s left hand rule, factors affecting force
❌ EXCLUDE: Magnetic flux linkage, Hall effect, vector cross product for force direction
🎯 FOCUS: Students apply F = BIL and use Fleming''s LHR to predict force direction
📝 EXAM TIP: 3-4 marks calculating force or predicting direction using Fleming''s LHR' WHERE (title ILIKE '%motor effect%' OR title ILIKE '%F = BIL%' OR title ILIKE '%fleming%left%') AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%physics%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: DC motor operation (coil rotates in magnetic field), split ring commutator function, factors affecting motor speed, applications
❌ EXCLUDE: AC motors, brushless motors, motor efficiency calculations, torque analysis
🎯 FOCUS: Students explain how DC motor works and role of commutator
📝 EXAM TIP: 4-6 marks explaining motor operation and function of commutator' WHERE title ILIKE '%motor%' AND title NOT ILIKE '%effect%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%physics%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Electromagnetic induction (changing magnetic field induces voltage), generator operation basics, factors affecting induced voltage
❌ EXCLUDE: Lenz''s law mathematical treatment, Faraday''s law with calculus, self-inductance
🎯 FOCUS: Students explain how generators produce electricity
📝 EXAM TIP: 3-4 marks explaining how changing magnetic field induces voltage' WHERE (title ILIKE '%electromagnetic induction%' OR title ILIKE '%generator%' OR title ILIKE '%induced%') AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%physics%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Transformer equation Vp/Vs = Np/Ns, step-up and step-down transformers, transformer efficiency (Vp×Ip = Vs×Is for 100% efficiency)
❌ EXCLUDE: Transformer losses analysis, core saturation, eddy current calculations
🎯 FOCUS: Students apply transformer equation to calculate voltages and turns
📝 EXAM TIP: 3-4 marks calculating secondary voltage or number of turns' WHERE title ILIKE '%transformer%' AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%physics%'));

-- Physics Module 8: Space Physics
UPDATE public.course_lessons SET description = '✅ INCLUDE: Solar system structure (Sun, planets, dwarf planets, moons, asteroids, comets), order of planets, characteristics of inner vs outer planets
❌ EXCLUDE: Planetary formation detailed theory, exoplanet detection, orbital mechanics calculations
🎯 FOCUS: Students describe solar system structure and compare planets
📝 EXAM TIP: 2-3 marks ordering planets or comparing inner and outer planets' WHERE (title ILIKE '%solar system%' OR title ILIKE '%planet%') AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%physics%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Star life cycle (nebula → protostar → main sequence → red giant → white dwarf OR supergiant → supernova → neutron star/black hole), factors determining outcome
❌ EXCLUDE: Hertzsprung-Russell diagram calculations, stellar nucleosynthesis detail, degeneracy pressure
🎯 FOCUS: Students describe life cycle stages for different mass stars
📝 EXAM TIP: 4-6 marks describing life cycle of a Sun-like star vs massive star' WHERE (title ILIKE '%star%life%' OR title ILIKE '%stellar evolution%' OR title ILIKE '%life cycle%star%') AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%physics%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Natural satellites (moons) vs artificial satellites, circular orbits, orbital speed and period, geostationary and polar orbits uses
❌ EXCLUDE: Orbital mechanics calculations, Kepler''s laws derivations, escape velocity calculations
🎯 FOCUS: Students compare types of orbits and explain their uses
📝 EXAM TIP: 2-3 marks explaining why geostationary orbit useful for communications' WHERE (title ILIKE '%satellite%' OR title ILIKE '%orbit%') AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%physics%'));

UPDATE public.course_lessons SET description = '✅ INCLUDE: Red-shift as evidence for expanding universe, further galaxies show greater red-shift, Big Bang theory as origin of universe, cosmic microwave background radiation
❌ EXCLUDE: Hubble''s law calculations, cosmological redshift derivation, dark energy/dark matter
🎯 FOCUS: Students explain red-shift evidence and Big Bang theory
📝 EXAM TIP: 3-4 marks explaining how red-shift supports expanding universe/Big Bang' WHERE (title ILIKE '%red-shift%' OR title ILIKE '%redshift%' OR title ILIKE '%big bang%' OR title ILIKE '%expanding universe%') AND module_id IN (SELECT id FROM course_modules WHERE course_id IN (SELECT id FROM courses WHERE subject ILIKE '%physics%'));