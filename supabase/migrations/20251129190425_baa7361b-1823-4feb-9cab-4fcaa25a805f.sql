
-- Add rich GCSE scope descriptions for Physics lessons

-- Energy Module
UPDATE course_lessons SET description = '✅ INCLUDE: Bio-fuels as renewable energy sources, carbon neutrality concept, advantages and disadvantages of bio-fuels, comparison with fossil fuels, environmental impact assessment.

❌ EXCLUDE: Detailed organic chemistry of bio-fuel production, industrial-scale processing, economic analysis beyond basic comparisons.

🎯 FOCUS: Understanding bio-fuels as carbon-neutral energy sources, evaluating sustainability claims, comparing energy density and environmental impact.

📝 EXAM TIP: Questions often ask you to evaluate bio-fuels - always discuss BOTH advantages (renewable, carbon-neutral) AND disadvantages (land use, food vs fuel debate).'
WHERE id = '5cab86c0-33c9-4a37-b54c-700f1b3bc75b';

-- Electricity Module
UPDATE course_lessons SET description = '✅ INCLUDE: Resistance definition (R = V/I), ohms as unit, factors affecting resistance (length, cross-sectional area, material, temperature), Ohm''s law, I-V characteristics.

❌ EXCLUDE: Resistivity calculations, semiconductor physics, superconductivity, complex circuit analysis beyond series/parallel.

🎯 FOCUS: Using R = V/I to calculate resistance, understanding how resistance affects current flow, interpreting I-V graphs for ohmic and non-ohmic conductors.

📝 EXAM TIP: Remember resistance INCREASES with length and temperature, but DECREASES with cross-sectional area. Use the formula triangle for rearranging R = V/I.'
WHERE id = '596f04d6-b1d0-4115-8b36-eb6f7d4a4b7e';

UPDATE course_lessons SET description = '✅ INCLUDE: Required practical - investigating resistance of a wire, measuring current and voltage, calculating resistance, controlling variables (length, temperature), plotting resistance vs length graphs.

❌ EXCLUDE: Complex error analysis, resistivity calculations, advanced graph transformations.

🎯 FOCUS: Planning and conducting the resistance investigation, identifying independent/dependent/control variables, drawing conclusions from experimental data.

📝 EXAM TIP: This is a required practical - know the method, variables, and how to calculate resistance from your measurements. Questions often ask about sources of error.'
WHERE id = '9b47c444-3b38-4572-b753-acb622bb8e49';

UPDATE course_lessons SET description = '✅ INCLUDE: Diodes (allow current in one direction only), LEDs, LDRs (resistance decreases with light intensity), thermistors (resistance decreases with temperature), I-V characteristics of each device.

❌ EXCLUDE: Internal semiconductor physics, transistor operation, complex sensor circuits, digital electronics.

🎯 FOCUS: Recognising circuit symbols, understanding how each device responds to conditions, interpreting I-V graphs, selecting appropriate devices for applications.

📝 EXAM TIP: Know the characteristic I-V graphs for each device. For LDRs: more light = less resistance. For thermistors: higher temperature = less resistance.'
WHERE id = '243a4452-7710-46e6-a35f-aec3de3aee02';

UPDATE course_lessons SET description = '✅ INCLUDE: Potential divider circuits with LDRs and thermistors, how output voltage changes with conditions, applications in automatic systems (e.g., street lights, fire alarms).

❌ EXCLUDE: Complex transistor switching circuits, operational amplifiers, microcontroller programming, industrial control systems.

🎯 FOCUS: Understanding how potential dividers work, predicting output voltage changes when sensor resistance changes, designing simple sensing circuits.

📝 EXAM TIP: In potential divider questions, remember: output voltage depends on the RATIO of resistances. When LDR resistance decreases (more light), work out which way the output voltage changes.'
WHERE id = 'd4f294ae-5b7f-48c4-be4e-b53857a4ecfd';

UPDATE course_lessons SET description = '✅ INCLUDE: Series circuits (same current, voltages add up), parallel circuits (same voltage, currents add up), calculating total resistance in series and parallel, applying Ohm''s law to circuit problems.

❌ EXCLUDE: Complex networks requiring Kirchhoff''s laws, internal resistance of cells, potentiometer circuits.

🎯 FOCUS: Calculating current, voltage and resistance in series and parallel circuits, understanding how adding resistors affects total resistance.

📝 EXAM TIP: In series: R_total = R1 + R2. In parallel: 1/R_total = 1/R1 + 1/R2. Adding resistors in series INCREASES total resistance; in parallel it DECREASES total resistance.'
WHERE id = '2427efde-4744-4019-8d1f-dbad4894b6d5';

UPDATE course_lessons SET description = '✅ INCLUDE: Mains electricity (230V, 50Hz AC in UK), live/neutral/earth wires and their functions, fuses and circuit breakers, power calculations (P = IV, P = I²R), energy calculations (E = Pt), electrical safety.

❌ EXCLUDE: Three-phase power, power factor, detailed transformer calculations, industrial electrical systems.

🎯 FOCUS: Understanding the three-pin plug and why each wire is needed, calculating power and energy, choosing appropriate fuse ratings, explaining safety features.

📝 EXAM TIP: To find fuse rating: calculate current using P = IV, then choose the next fuse rating UP (common values: 3A, 5A, 13A). The earth wire is for SAFETY only.'
WHERE id = '7578fa75-239d-4f65-9c98-8f350464c743';

UPDATE course_lessons SET description = '✅ INCLUDE: Electric field definition and representation using field lines, field direction (positive to negative), field patterns around point charges and parallel plates, electrostatic effects and applications.

❌ EXCLUDE: Electric field strength calculations, Coulomb''s law, electric potential, capacitance, quantitative field problems.

🎯 FOCUS: Drawing and interpreting electric field patterns, understanding field direction convention, explaining electrostatic phenomena (attraction, repulsion, charging by induction).

📝 EXAM TIP: Field lines go from POSITIVE to NEGATIVE. Closer field lines = stronger field. Field lines never cross each other.'
WHERE id = 'bfd801cd-9acc-4722-9e0d-220b86dc0af3';

-- Particle Model of Matter
UPDATE course_lessons SET description = '✅ INCLUDE: Gas pressure as particles colliding with container walls, effect of temperature on pressure (at constant volume), effect of volume on pressure (at constant temperature), pressure-volume relationship, doing work on a gas.

❌ EXCLUDE: Ideal gas equation (pV = nRT), partial pressures, real gas behaviour, thermodynamic cycles.

🎯 FOCUS: Explaining pressure in terms of particle collisions, predicting how pressure changes with temperature and volume, understanding that compressing a gas does work and increases temperature.

📝 EXAM TIP: For a fixed mass of gas at constant temperature: pressure × volume = constant (Boyle''s Law). When volume decreases, pressure increases.'
WHERE id = '89bdb769-f94a-479d-b783-7adc6879c633';

-- Atomic Structure
UPDATE course_lessons SET description = '✅ INCLUDE: Plum pudding model (Thomson), nuclear model (Rutherford), Bohr model with electron shells, evidence from alpha particle scattering experiment, discovery of neutron (Chadwick).

❌ EXCLUDE: Quantum mechanical model, wave-particle duality, electron orbitals, Schrödinger equation, quarks.

🎯 FOCUS: Understanding how each model improved on the previous one, explaining how alpha scattering provided evidence for the nuclear model, describing the structure of the atom.

📝 EXAM TIP: Know the timeline: plum pudding → nuclear model → Bohr model. Alpha particles were deflected because they passed close to the concentrated positive nucleus.'
WHERE id = '82b77dab-b427-4616-9910-057f8676fa89';

-- Forces Module
UPDATE course_lessons SET description = '✅ INCLUDE: Pressure in fluids (P = F/A), pressure increases with depth, calculating pressure at a depth (P = ρgh), pressure in liquids acts in all directions.

❌ EXCLUDE: Bernoulli''s principle, fluid dynamics, viscosity calculations, hydraulic systems beyond basic pressure transmission.

🎯 FOCUS: Calculating pressure using P = F/A and P = ρgh, explaining why pressure increases with depth, understanding pressure transmission in liquids.

📝 EXAM TIP: Remember the units: pressure in Pa (N/m²), density in kg/m³, depth in m. Use P = ρgh for pressure due to a column of liquid.'
WHERE id = 'f3aebb52-de24-496e-94d8-df11700f66fc';

UPDATE course_lessons SET description = '✅ INCLUDE: Upthrust as the resultant force on a submerged object, Archimedes'' principle (upthrust = weight of fluid displaced), floating and sinking conditions, calculating upthrust.

❌ EXCLUDE: Centre of buoyancy, ship stability, complex fluid dynamics, metacentric height.

🎯 FOCUS: Explaining upthrust in terms of pressure difference, understanding why objects float or sink, calculating whether an object will float based on densities.

📝 EXAM TIP: Object floats when: upthrust = weight (or object density < fluid density). Object sinks when: weight > upthrust (or object density > fluid density).'
WHERE id = 'fe1e9901-6a90-4299-863f-6875a7b2031f';

UPDATE course_lessons SET description = '✅ INCLUDE: Atmospheric pressure caused by weight of air above, variation with altitude, measuring atmospheric pressure, effects of atmospheric pressure (e.g., drinking straws, suction cups).

❌ EXCLUDE: Weather systems, pressure gradients, barometric formula derivation, atmospheric layers in detail.

🎯 FOCUS: Explaining atmospheric pressure in terms of air particle collisions, understanding why pressure decreases with altitude, explaining everyday phenomena involving atmospheric pressure.

📝 EXAM TIP: Atmospheric pressure at sea level ≈ 101,000 Pa (101 kPa). Pressure decreases with altitude because there''s less air above pushing down.'
WHERE id = 'ed98e635-23da-41eb-964c-67a9c64b71cc';

UPDATE course_lessons SET description = '✅ INCLUDE: Newton''s first law (object remains at rest or constant velocity unless acted on by resultant force), second law (F = ma), third law (action-reaction pairs), applying laws to real situations.

❌ EXCLUDE: Non-inertial reference frames, rotational dynamics (torque, angular momentum), relativistic mechanics.

🎯 FOCUS: Stating and applying all three laws, calculating acceleration using F = ma, identifying action-reaction pairs, explaining motion in terms of forces.

📝 EXAM TIP: For F = ma questions, always identify ALL forces first, find the resultant force, then use F = ma. Third law pairs act on DIFFERENT objects.'
WHERE id = '79e46e4c-cd62-4325-a199-3a763cc3a5ba';

-- Waves Module
UPDATE course_lessons SET description = '✅ INCLUDE: Transverse and longitudinal waves, amplitude, wavelength, frequency, period, wave speed equation (v = fλ), wave equation (T = 1/f), examples of each wave type.

❌ EXCLUDE: Wave interference patterns, standing waves, Doppler effect calculations, wave polarisation.

🎯 FOCUS: Defining wave properties, distinguishing transverse from longitudinal waves, using v = fλ to calculate wave speed, frequency or wavelength.

📝 EXAM TIP: Transverse waves oscillate PERPENDICULAR to direction of travel (light, water waves). Longitudinal waves oscillate PARALLEL (sound). Use v = fλ for all wave calculations.'
WHERE id = '9a01470d-bb64-444d-a5f9-7c80cf1a9b2d';

UPDATE course_lessons SET description = '✅ INCLUDE: Required practical - investigating waves in a ripple tank, measuring wavelength and frequency, calculating wave speed, observing reflection and refraction of water waves.

❌ EXCLUDE: Diffraction patterns, interference experiments, standing wave investigations.

🎯 FOCUS: Measuring wave properties experimentally, using stroboscope to "freeze" wave motion, calculating wave speed from measurements, identifying sources of error.

📝 EXAM TIP: This is a required practical - know how to measure wavelength (ruler), frequency (counting waves per second or using stroboscope), and calculate speed using v = fλ.'
WHERE id = '9ba39052-85ed-4d5a-8137-5e233bb19ac3';

UPDATE course_lessons SET description = '✅ INCLUDE: Required practical - investigating reflection and refraction of light, law of reflection, Snell''s law qualitatively, total internal reflection, critical angle.

❌ EXCLUDE: Snell''s law calculations with refractive index, optical fibre physics in detail, dispersion calculations.

🎯 FOCUS: Measuring angles of incidence and reflection, observing refraction at boundaries, demonstrating total internal reflection, explaining applications (optical fibres, prisms).

📝 EXAM TIP: Law of reflection: angle of incidence = angle of reflection. Light bends TOWARDS the normal when entering a denser medium (slower speed).'
WHERE id = '877949c4-c7da-4940-8f32-a834418ed7cb';

UPDATE course_lessons SET description = '✅ INCLUDE: EM spectrum order (radio to gamma), harmful effects of UV (skin cancer, eye damage), X-rays and gamma rays (cell damage, cancer risk), safety precautions for ionising radiation.

❌ EXCLUDE: Detailed radiation dosimetry, DNA damage mechanisms at molecular level, radiation therapy physics.

🎯 FOCUS: Identifying which EM waves are harmful and why, explaining how ionising radiation damages cells, describing safety measures for different types of radiation.

📝 EXAM TIP: UV causes skin cancer and eye damage. X-rays and gamma rays are IONISING - they can damage DNA and cause cancer. Lead shielding protects against X-rays/gamma.'
WHERE id = '39b37686-51c9-4bdc-acb9-cb42095dd31c';

UPDATE course_lessons SET description = '✅ INCLUDE: Converging (convex) and diverging (concave) lenses, focal point and focal length, ray diagrams showing image formation, nature of images (real/virtual, magnified/diminished, upright/inverted).

❌ EXCLUDE: Lens equation (1/f = 1/u + 1/v), magnification calculations, lens aberrations, compound lens systems.

🎯 FOCUS: Drawing accurate ray diagrams using the three principal rays, determining image characteristics from ray diagrams, understanding how eye defects are corrected.

📝 EXAM TIP: Three rays for converging lens: parallel ray through focal point, ray through centre undeviated, ray through focal point emerges parallel. Use a ruler for ray diagrams!'
WHERE id = 'e20dba10-a3d7-4927-bbf6-9653399c9d5c';

UPDATE course_lessons SET description = '✅ INCLUDE: Visible light as part of EM spectrum, colours corresponding to different wavelengths/frequencies, white light dispersion through prism, how objects appear coloured (absorption and reflection).

❌ EXCLUDE: Wave optics, interference patterns, spectroscopy, colour mixing calculations.

🎯 FOCUS: Understanding the visible spectrum order (ROYGBIV), explaining why objects appear different colours, describing dispersion of white light.

📝 EXAM TIP: Red has longest wavelength/lowest frequency. Violet has shortest wavelength/highest frequency. A red object ABSORBS all colours except red, which it REFLECTS.'
WHERE id = '1f04906b-4655-426b-b5e7-93eb37da6755';

UPDATE course_lessons SET description = '✅ INCLUDE: Colour filters absorb certain wavelengths and transmit others, primary colours of light (RGB), how coloured objects appear under coloured light, colour addition vs subtraction.

❌ EXCLUDE: Spectral analysis, filter transmission curves, pigment chemistry, colour perception physiology.

🎯 FOCUS: Predicting what colours will be transmitted/absorbed by filters, explaining appearance of coloured objects under coloured light, understanding primary colour mixing.

📝 EXAM TIP: A red filter only transmits RED light and absorbs other colours. A red object under green light appears BLACK (no red light to reflect).'
WHERE id = 'f22fc842-3a37-4e2f-8fb2-20ef34c05e55';

UPDATE course_lessons SET description = '✅ INCLUDE: P-waves (longitudinal, travel through solids and liquids), S-waves (transverse, only through solids), using seismic waves to study Earth''s structure, shadow zones and what they reveal.

❌ EXCLUDE: Seismograph analysis, earthquake magnitude scales, plate tectonics details, seismic tomography.

🎯 FOCUS: Distinguishing P-waves from S-waves, explaining how seismic data reveals Earth''s internal structure, understanding why S-waves don''t travel through the liquid outer core.

📝 EXAM TIP: P-waves are LONGITUDINAL (travel through everything), S-waves are TRANSVERSE (solids only). S-wave shadow zone proves liquid outer core exists.'
WHERE id = '8e4206b2-004d-47e8-9665-9d19bc8f007a';

-- Magnetism and Electromagnetism
UPDATE course_lessons SET description = '✅ INCLUDE: AC generators (alternators) - rotating coil in magnetic field produces AC, structure and function, factors affecting output (speed, coils, field strength), dynamos for DC output.

❌ EXCLUDE: Three-phase generators, power station generators, back-EMF, generator efficiency calculations.

🎯 FOCUS: Explaining how rotation in a magnetic field induces EMF, understanding why output is AC, describing how to increase generator output, comparing alternators and dynamos.

📝 EXAM TIP: Rotating a coil in a magnetic field produces AC because the coil cuts field lines in opposite directions during each half rotation. Faster rotation = higher frequency AND higher voltage.'
WHERE id = '9a2d2c88-e9a1-4a17-bea4-5c5a1284279a';

-- Practical Skills Module
UPDATE course_lessons SET description = '✅ INCLUDE: Using rulers (mm precision), protractors for angles, vernier calipers for small lengths, micrometer for very small lengths, parallax error, reading scales correctly.

❌ EXCLUDE: Digital measurement systems, laser measurement, coordinate measuring machines, interferometry.

🎯 FOCUS: Selecting appropriate measuring instruments, reading scales to correct precision, minimising parallax error, recording measurements with correct significant figures.

📝 EXAM TIP: Ruler precision = ±0.5mm, protractor = ±0.5°, vernier caliper = ±0.1mm, micrometer = ±0.01mm. Always read at eye level to avoid parallax error.'
WHERE id = 'fc342ef5-ca8f-4ae7-82ff-7cebbdf6e0b8';

UPDATE course_lessons SET description = '✅ INCLUDE: Measuring liquid volumes with measuring cylinders, reading meniscus correctly, using pipettes and burettes, measuring irregular solid volumes by displacement, precision of volume measurements.

❌ EXCLUDE: Volumetric flask calibration, density bottles, advanced displacement techniques.

🎯 FOCUS: Selecting appropriate apparatus for volume measurements, reading meniscus at bottom of curve, calculating volume of irregular objects using displacement method.

📝 EXAM TIP: Always read the BOTTOM of the meniscus at EYE LEVEL. For irregular objects: volume = final water level - initial water level.'
WHERE id = '477101ba-0400-45fb-9052-6924031cd0a7';

UPDATE course_lessons SET description = '✅ INCLUDE: Measuring mass with balances, measuring time with stopwatches/light gates, measuring temperature with thermometers, human reaction time errors, repeated measurements.

❌ EXCLUDE: Electronic data logging systems, automated measurement, calibration procedures.

🎯 FOCUS: Selecting appropriate measuring instruments, understanding precision and accuracy, reducing random errors through repeated measurements, calculating mean values.

📝 EXAM TIP: Human reaction time ≈ 0.2-0.3s - significant error for short time measurements. Take multiple readings and calculate the mean to reduce random error.'
WHERE id = '34186c4b-36e8-4d45-8747-7b62ac9ebb58';

UPDATE course_lessons SET description = '✅ INCLUDE: Setting up simple circuits safely, using ammeters (in series) and voltmeters (in parallel), reading analogue and digital meters, circuit symbols, identifying faults.

❌ EXCLUDE: Oscilloscope operation, signal generators, complex test equipment, electronics troubleshooting.

🎯 FOCUS: Drawing and building circuits from diagrams, connecting meters correctly, taking accurate readings, checking circuit connections before switching on.

📝 EXAM TIP: Ammeter = SERIES (current flows through it). Voltmeter = PARALLEL (measures potential difference across component). Check polarity on meters!'
WHERE id = 'eb7c2fd7-3e02-4ffa-8f3d-ebc101df5b0a';

UPDATE course_lessons SET description = '✅ INCLUDE: Risk assessment basics, identifying hazards in physics experiments, safety precautions for electricity/heat/radiation, safe handling of equipment, eye protection requirements.

❌ EXCLUDE: COSHH regulations, formal risk assessment documentation, industrial safety standards.

🎯 FOCUS: Identifying hazards and risks in common physics experiments, suggesting appropriate safety precautions, understanding why certain procedures are followed.

📝 EXAM TIP: Common hazards to mention: electrical (shock, burns), thermal (burns from hot equipment), radiation (eye damage, skin damage), mechanical (falling objects, sharp edges).'
WHERE id = '2166f727-b6d0-4149-9406-184239578594';
