
-- Populate rich GCSE scope descriptions for all GCSE Maths lessons
-- Format: ✅ INCLUDE, ❌ EXCLUDE, 🎯 FOCUS, 📝 EXAM TIP

-- NUMBER MODULE
UPDATE course_lessons SET description = '✅ INCLUDE: Natural numbers, integers, rational/irrational numbers, BIDMAS/BODMAS order of operations, prime numbers, square numbers, cube numbers, triangle numbers
❌ EXCLUDE: Complex numbers, number theory proofs, modular arithmetic
🎯 FOCUS: Correctly applying order of operations, identifying number types, recognising special number sequences
📝 EXAM TIP: BIDMAS questions often appear in non-calculator papers - show each step clearly'
WHERE id = '85ff65fd-4304-4cbf-9b7f-99f2a5d26d6b';

UPDATE course_lessons SET description = '✅ INCLUDE: Finding multiples, finding factors, factor pairs, prime factorisation using factor trees, prime factor decomposition, expressing numbers as products of primes
❌ EXCLUDE: Fundamental theorem of arithmetic proofs, prime number theorems
🎯 FOCUS: Systematic factor finding, drawing factor trees, writing numbers in index form
📝 EXAM TIP: Always check factor pairs systematically - start from 1 and work up'
WHERE id = 'ece8cd4a-82d3-4eb6-9b12-19495577cb6a';

UPDATE course_lessons SET description = '✅ INCLUDE: Finding LCM using listing, finding LCM using prime factors, finding HCF using listing, finding HCF using prime factors, Venn diagram method for LCM/HCF
❌ EXCLUDE: Euclidean algorithm, extended GCD
🎯 FOCUS: Using prime factorisation efficiently, Venn diagram method, word problems involving LCM/HCF
📝 EXAM TIP: LCM = product of all prime factors at highest powers; HCF = product of common factors at lowest powers'
WHERE id = '702cdc0f-4041-4baf-a11b-1ff5215bae7b';

UPDATE course_lessons SET description = '✅ INCLUDE: Adding fractions, subtracting fractions, multiplying fractions, dividing fractions, mixed numbers, improper fractions, simplifying fractions, equivalent fractions
❌ EXCLUDE: Partial fractions, continued fractions
🎯 FOCUS: Finding common denominators, converting between mixed numbers and improper fractions, simplifying answers
📝 EXAM TIP: Always simplify your final answer - check for common factors'
WHERE id = '1a27e8a9-f71d-48d1-a24d-3df8438d7042';

UPDATE course_lessons SET description = '✅ INCLUDE: Converting fractions to decimals, converting decimals to fractions, converting fractions to percentages, converting percentages to fractions, ordering FDP
❌ EXCLUDE: Binary/hexadecimal conversions
🎯 FOCUS: Recognising common equivalents (1/4=0.25=25%), converting between all three forms fluently
📝 EXAM TIP: Learn key equivalents: 1/2=50%, 1/4=25%, 1/5=20%, 1/8=12.5%, 1/3≈33.3%'
WHERE id = '58452b49-3fc8-46ba-994a-8822bd0f6142';

UPDATE course_lessons SET description = '✅ INCLUDE: Converting terminating decimals to fractions, converting recurring decimals to fractions using algebra, recognising which fractions give recurring decimals
❌ EXCLUDE: Proofs about decimal expansions, transcendental numbers
🎯 FOCUS: Algebraic method for recurring decimals (multiply by 10^n then subtract), simplifying resulting fractions
📝 EXAM TIP: For 0.̇3̇ type: let x = 0.333..., then 10x = 3.333..., so 9x = 3, x = 1/3'
WHERE id = '5b72e7a5-ff9c-4828-8dc4-86f0f4de0f40';

UPDATE course_lessons SET description = '✅ INCLUDE: Rounding to decimal places, rounding to significant figures, truncation, appropriate degree of accuracy
❌ EXCLUDE: Floating point representation, computer rounding errors
🎯 FOCUS: Identifying significant figures correctly (especially with leading zeros), choosing appropriate accuracy for context
📝 EXAM TIP: For sig figs, count from the first non-zero digit. 0.00456 to 2sf = 0.0046'
WHERE id = '979f1771-42cb-4653-8c19-a4326c5ba3d1';

UPDATE course_lessons SET description = '✅ INCLUDE: Estimating calculations by rounding, checking reasonableness of answers, estimating square roots, estimation in context
❌ EXCLUDE: Statistical estimation, interval estimation
🎯 FOCUS: Rounding to 1 significant figure for quick mental calculations, knowing when estimates are appropriate
📝 EXAM TIP: Round each number to 1sf BEFORE calculating. Show your rounded values clearly'
WHERE id = '5060789a-f97e-4f73-b8d0-cf3d13e78a2f';

UPDATE course_lessons SET description = '✅ INCLUDE: Upper and lower bounds, error intervals, bounds in calculations (+ - × ÷), maximum and minimum values, bounds with measurements
❌ EXCLUDE: Propagation of uncertainty in physics contexts, statistical confidence intervals
🎯 FOCUS: Finding bounds from rounded values, combining bounds in calculations correctly
📝 EXAM TIP: For max value: use upper bounds when multiplying/adding, lower bounds when dividing/subtracting'
WHERE id = 'e05a79cc-8f5d-453c-841d-0a7b7c2ff4d8';

UPDATE course_lessons SET description = '✅ INCLUDE: Writing numbers in standard form, converting from standard form, calculations in standard form, ordering numbers in standard form, standard form on calculators
❌ EXCLUDE: Scientific notation in programming, significant figures in scientific contexts
🎯 FOCUS: A × 10^n where 1 ≤ A < 10, multiplying/dividing standard form numbers
📝 EXAM TIP: When multiplying: multiply the numbers, add the powers. Adjust if result is not 1≤A<10'
WHERE id = '5a7ed2e3-d820-4767-a5a1-4451826f6552';

-- ALGEBRA MODULE
UPDATE course_lessons SET description = '✅ INCLUDE: Collecting like terms, simplifying expressions, substitution into expressions, using formulae, writing expressions from words
❌ EXCLUDE: Abstract algebra, ring theory
🎯 FOCUS: Identifying like terms, correct use of algebraic notation, substituting negative numbers carefully
📝 EXAM TIP: Remember: 2a means 2×a, ab means a×b, a² means a×a. Watch signs when substituting negatives'
WHERE id = 'ca6ab811-cdb0-47e2-a423-cdeb13b888dd';

UPDATE course_lessons SET description = '✅ INCLUDE: Laws of indices (multiplication, division, power of power), negative indices, fractional indices, zero index, simplifying using index laws
❌ EXCLUDE: Logarithms, exponential functions (A-Level), complex indices
🎯 FOCUS: Applying index laws correctly, understanding that a^(-n) = 1/a^n and a^(1/n) = ⁿ√a
📝 EXAM TIP: a^m × a^n = a^(m+n), a^m ÷ a^n = a^(m-n), (a^m)^n = a^(mn), a^0 = 1'
WHERE id = '881d2a78-a725-4fdb-bc66-0cbe2664a327';

UPDATE course_lessons SET description = '✅ INCLUDE: Expanding single brackets, expanding double brackets (FOIL), expanding triple brackets, squaring brackets, difference of two squares
❌ EXCLUDE: Multinomial theorem, binomial expansion (A-Level)
🎯 FOCUS: Systematic bracket expansion, collecting like terms after expansion, recognising special cases
📝 EXAM TIP: (a+b)² = a² + 2ab + b², (a-b)² = a² - 2ab + b², (a+b)(a-b) = a² - b²'
WHERE id = '9b1e3579-de65-4672-baf8-e8cd3e67d153';

UPDATE course_lessons SET description = '✅ INCLUDE: Factorising with common factors, factorising quadratics (x²+bx+c), factorising difference of two squares, factorising by grouping
❌ EXCLUDE: Factor theorem for polynomials, synthetic division
🎯 FOCUS: Finding HCF of terms, recognising factorisable expressions, checking by expanding
📝 EXAM TIP: Always look for common factors first. Check your answer by expanding back'
WHERE id = '4dfdbbe5-119e-4a9a-a9ed-c1258714a385';

UPDATE course_lessons SET description = '✅ INCLUDE: Simplifying surds, adding/subtracting surds, multiplying surds, dividing surds, rationalising denominators (single and two-term)
❌ EXCLUDE: Nested radicals, denesting algorithms
🎯 FOCUS: √(ab) = √a × √b, rationalising using conjugates, simplifying √n by finding square factors
📝 EXAM TIP: To rationalise a/(b+√c), multiply top and bottom by (b-√c)'
WHERE id = 'ee036f9b-b6f3-47c9-8507-07dcbed75bcc';

UPDATE course_lessons SET description = '✅ INCLUDE: One-step equations, two-step equations, equations with brackets, equations with unknowns on both sides, equations with fractions
❌ EXCLUDE: Differential equations, transcendental equations
🎯 FOCUS: Inverse operations, maintaining balance, dealing with negatives, clearing fractions
📝 EXAM TIP: Whatever you do to one side, do to the other. Show each step on a new line'
WHERE id = '825aada3-88cd-415c-a3ee-e4f34996e6af';

UPDATE course_lessons SET description = '✅ INCLUDE: Changing the subject of a formula, rearranging with powers and roots, rearranging with fractions, rearranging where subject appears twice
❌ EXCLUDE: Implicit differentiation for rearranging
🎯 FOCUS: Isolating the required variable, dealing with subject appearing multiple times (factorising out)
📝 EXAM TIP: If subject appears twice, collect terms with subject on one side, factorise, then divide'
WHERE id = '2bac8fa3-a5c3-4645-a41a-fcddad563f09';

UPDATE course_lessons SET description = '✅ INCLUDE: Factorising x²+bx+c, factorising ax²+bx+c, solving quadratics by factorising, finding factors that multiply and add
❌ EXCLUDE: Factorising higher degree polynomials, factor theorem
🎯 FOCUS: Finding factor pairs, systematic approach to ax²+bx+c, setting each bracket to zero
📝 EXAM TIP: For ax²+bx+c, find two numbers that multiply to give ac and add to give b'
WHERE id = '60417d72-29c3-4ea5-9fe4-80352ade343b';

UPDATE course_lessons SET description = '✅ INCLUDE: Using the quadratic formula x = (-b±√(b²-4ac))/2a, identifying a, b, c coefficients, simplifying solutions, surd answers
❌ EXCLUDE: Derivation of quadratic formula, complex solutions
🎯 FOCUS: Correct substitution into formula, handling negative coefficients, simplifying surds in answers
📝 EXAM TIP: Write out a=, b=, c= first. Be careful with signs. The formula is given on the formula sheet'
WHERE id = 'b7f064d1-1aa7-4d74-821d-b4d75b64dda2';

UPDATE course_lessons SET description = '✅ INCLUDE: Completing the square for x²+bx+c, completing the square for ax²+bx+c, finding turning points, solving equations by completing square
❌ EXCLUDE: Completing the square for conic sections
🎯 FOCUS: Halving the coefficient of x, adjusting the constant, finding (x+p)²+q form
📝 EXAM TIP: x²+bx+c = (x+b/2)² - (b/2)² + c. Turning point is at (-b/2, c-(b/2)²)'
WHERE id = '5132d1da-0dd6-4d4b-a800-026047132f3a';

UPDATE course_lessons SET description = '✅ INCLUDE: Simplifying algebraic fractions, adding/subtracting algebraic fractions, multiplying/dividing algebraic fractions, solving equations with algebraic fractions
❌ EXCLUDE: Partial fractions decomposition (A-Level)
🎯 FOCUS: Factorising before simplifying, finding common denominators, clearing fractions in equations
📝 EXAM TIP: Always factorise numerator and denominator first - look for common factors to cancel'
WHERE id = 'e5ef5de3-0ce9-4dc5-9286-da6eaf444e62';

UPDATE course_lessons SET description = '✅ INCLUDE: Term-to-term rules, position-to-term rules (nth term), arithmetic sequences, geometric sequences, quadratic sequences, Fibonacci-type sequences
❌ EXCLUDE: Series and summation notation, convergence tests, generating functions
🎯 FOCUS: Finding nth term for linear sequences (an+b), finding nth term for quadratic sequences (an²+bn+c)
📝 EXAM TIP: For quadratic sequences: 2nd differences are constant. Coefficient of n² = half the 2nd difference'
WHERE id = 'ccbefabc-163d-4267-b9aa-61e7c2742843';

UPDATE course_lessons SET description = '✅ INCLUDE: Solving linear inequalities, representing inequalities on number lines, solving quadratic inequalities, set notation for inequalities
❌ EXCLUDE: Systems of inequalities in 3+ variables, linear programming
🎯 FOCUS: Reversing inequality sign when multiplying/dividing by negative, quadratic inequality sign diagrams
📝 EXAM TIP: For x² < a², solution is -√a < x < √a. For x² > a², solution is x < -√a or x > √a'
WHERE id = 'cc956657-f47a-4811-827d-86740e6d3213';

UPDATE course_lessons SET description = '✅ INCLUDE: Drawing inequality regions, shading correct regions, finding intersection of regions, solid vs dashed lines, identifying coordinates satisfying inequalities
❌ EXCLUDE: Linear programming optimisation, feasible regions in 3D
🎯 FOCUS: Testing points to determine which side to shade, understanding ≤/≥ (solid) vs </> (dashed)
📝 EXAM TIP: Test (0,0) if not on the line - if it satisfies inequality, shade that side'
WHERE id = '79c054e4-9f5d-47fd-a79a-988102898894';

UPDATE course_lessons SET description = '✅ INCLUDE: Iteration formula x_{n+1} = f(x_n), using iteration to find roots, convergence of iteration, starting values
❌ EXCLUDE: Newton-Raphson method, fixed point theory, chaotic iteration
🎯 FOCUS: Substituting previous term into formula repeatedly, recognising convergence, appropriate accuracy
📝 EXAM TIP: Keep iterating until answers agree to required decimal places. Show each iteration clearly'
WHERE id = '5c36e3b5-2d7e-4be7-80bc-1b7f6d09e7ea';

UPDATE course_lessons SET description = '✅ INCLUDE: Solving linear simultaneous equations (elimination), solving linear simultaneous equations (substitution), solving linear and quadratic simultaneously
❌ EXCLUDE: Systems of 3+ equations, matrix methods
🎯 FOCUS: Choosing efficient method, eliminating one variable, substituting back to find both values
📝 EXAM TIP: For linear-quadratic: substitute linear into quadratic, solve quadratic, find corresponding y-values'
WHERE id = 'c3983f94-746e-4f20-85bc-88376de5390c';

UPDATE course_lessons SET description = '✅ INCLUDE: Algebraic proof, proving statements are always true/false, counter-examples, proof involving odd/even numbers, proof involving consecutive integers
❌ EXCLUDE: Proof by induction, proof by contradiction (A-Level methods)
🎯 FOCUS: Representing odd numbers as 2n+1, even as 2n, consecutive as n, n+1, n+2, showing results algebraically
📝 EXAM TIP: State what variables represent (e.g., "let n be any integer"). Show all algebraic steps clearly'
WHERE id = 'e9e5d5f9-6631-49b8-8980-b8b020be2907';

UPDATE course_lessons SET description = '✅ INCLUDE: Function notation f(x), evaluating functions, composite functions fg(x), inverse functions f⁻¹(x), domain and range
❌ EXCLUDE: Calculus of functions, limits, continuity proofs
🎯 FOCUS: Substituting into functions, order of operations in composites, finding inverses by rearranging
📝 EXAM TIP: fg(x) means do g first, then f. To find f⁻¹(x): write y=f(x), swap x and y, solve for y'
WHERE id = 'bd3d5189-e9ce-4424-8745-4313ca76b82a';

-- GRAPHS MODULE
UPDATE course_lessons SET description = '✅ INCLUDE: Finding gradient from two points, gradient = rise/run, positive and negative gradients, horizontal and vertical lines, gradient from graph
❌ EXCLUDE: Calculus-based gradient finding, tangent gradients
🎯 FOCUS: Using gradient formula (y₂-y₁)/(x₂-x₁), interpreting gradient in context, recognising steep vs gentle slopes
📝 EXAM TIP: Gradient = change in y ÷ change in x. Positive slope goes up left-to-right, negative goes down'
WHERE id = '24dc5d81-c96f-48a5-a568-723534998572';

UPDATE course_lessons SET description = '✅ INCLUDE: y = mx + c form, identifying gradient and y-intercept from equation, sketching lines from equation, finding equation from graph
❌ EXCLUDE: Parametric equations, vector equations of lines
🎯 FOCUS: m = gradient, c = y-intercept, converting to y=mx+c form, quick sketching using m and c
📝 EXAM TIP: To find equation: read off y-intercept (c), calculate gradient (m), write y = mx + c'
WHERE id = 'dc9a3b07-aa3b-4e37-b144-937550f72cc2';

UPDATE course_lessons SET description = '✅ INCLUDE: Table of values method, plotting coordinates, joining points, choosing appropriate scale, labelling axes
❌ EXCLUDE: Graphing software techniques, 3D line plotting
🎯 FOCUS: Substituting x-values systematically, plotting accurately, drawing smooth straight line through points
📝 EXAM TIP: Use at least 3 points to check accuracy. If points dont line up, check your substitutions'
WHERE id = 'ceaccebf-f7e3-4bbd-afb7-e551d9ab23d9';

UPDATE course_lessons SET description = '✅ INCLUDE: Finding midpoint of line segment, dividing line segment in given ratio, finding coordinates using ratio
❌ EXCLUDE: Section formula proofs, harmonic division
🎯 FOCUS: Midpoint formula ((x₁+x₂)/2, (y₁+y₂)/2), working with ratios on coordinate geometry
📝 EXAM TIP: For ratio m:n from A to B, point P = A + (m/(m+n)) × (B-A) for each coordinate'
WHERE id = 'fbef1921-5252-4cd3-84f2-29bd65aef7d5';

UPDATE course_lessons SET description = '✅ INCLUDE: Parallel lines have equal gradients, perpendicular lines have gradients that multiply to -1, finding parallel/perpendicular line equations
❌ EXCLUDE: Distance between parallel lines, angle between lines using gradients
🎯 FOCUS: If m₁ = m₂ lines are parallel, if m₁ × m₂ = -1 lines are perpendicular
📝 EXAM TIP: Perpendicular gradient = negative reciprocal. If gradient is 2, perpendicular gradient is -1/2'
WHERE id = '1956275d-ca70-4dbb-8d94-ceaad8d85355';

UPDATE course_lessons SET description = '✅ INCLUDE: Plotting quadratic graphs, identifying shape (U or ∩), finding roots/x-intercepts, finding vertex/turning point, line of symmetry
❌ EXCLUDE: Cubic and higher degree graphs, calculus methods for turning points
🎯 FOCUS: Table of values, recognising y = ax² + bx + c shape, finding key features from graph and equation
📝 EXAM TIP: Positive a = U-shaped (minimum), negative a = ∩-shaped (maximum). Axis of symmetry at x = -b/2a'
WHERE id = '349b6170-3189-45c2-85cc-25e5307712d2';

UPDATE course_lessons SET description = '✅ INCLUDE: Solving equations graphically, reading solutions from intersection points, solving simultaneous equations graphically, estimating solutions
❌ EXCLUDE: Numerical methods beyond graphical, iteration from graphs
🎯 FOCUS: Drawing both graphs accurately, finding x-coordinates of intersections, checking solutions
📝 EXAM TIP: Solutions to f(x) = g(x) are x-coordinates where graphs cross. Read carefully from graph'
WHERE id = 'c51aedec-7ed2-45ec-9d0e-d8ca4053aff2';

UPDATE course_lessons SET description = '✅ INCLUDE: y = f(x) + a (vertical translation), y = f(x + a) (horizontal translation), y = -f(x) (reflection in x-axis), y = f(-x) (reflection in y-axis), y = af(x) (vertical stretch)
❌ EXCLUDE: Combinations of multiple transformations, matrix representations of transformations
🎯 FOCUS: Describing transformations in words, sketching transformed graphs, understanding effect of each change
📝 EXAM TIP: f(x+a) moves LEFT by a, f(x)+a moves UP by a. The +a inside bracket is opposite direction'
WHERE id = 'f9b52739-99e0-4e44-8bcf-97c3aa205d3a';

UPDATE course_lessons SET description = '✅ INCLUDE: Interpreting real-life graphs, conversion graphs, utility bill graphs, mobile phone tariff graphs, drawing graphs from context
❌ EXCLUDE: Complex economic models, calculus-based optimisation
🎯 FOCUS: Reading values from graphs, understanding what gradient represents in context, identifying key features
📝 EXAM TIP: Always look at axis labels and units. Gradient often represents a rate (e.g., cost per unit)'
WHERE id = '63ccfb05-c892-4902-a68b-56242f36cfa9';

UPDATE course_lessons SET description = '✅ INCLUDE: Reading distance-time graphs, calculating speed from gradient, interpreting stationary periods, comparing journeys, drawing distance-time graphs
❌ EXCLUDE: Acceleration calculations, calculus-based kinematics
🎯 FOCUS: Gradient = speed, horizontal line = stationary, steeper = faster, area under graph NOT relevant here
📝 EXAM TIP: Speed = distance ÷ time = gradient of line. Remember to use correct units (mph, km/h, m/s)'
WHERE id = 'a4123b4c-5cb2-410b-8b77-5394c41eaa2f';

UPDATE course_lessons SET description = '✅ INCLUDE: Reading velocity-time graphs, calculating acceleration from gradient, calculating distance from area under graph, interpreting motion
❌ EXCLUDE: Variable acceleration, calculus-based methods
🎯 FOCUS: Gradient = acceleration, area under graph = distance travelled, negative gradient = deceleration
📝 EXAM TIP: Use trapezium rule or split into triangles/rectangles to find area. Check units throughout'
WHERE id = 'ae49194b-8b96-4f75-b8f9-02354f2e787f';

UPDATE course_lessons SET description = '✅ INCLUDE: Interpreting gradient of curved real-life graphs, estimating gradient using tangent lines, understanding rate of change in context
❌ EXCLUDE: Formal differentiation, instantaneous rate of change calculations
🎯 FOCUS: Drawing tangent at a point, calculating gradient of tangent, interpreting meaning in context
📝 EXAM TIP: Draw tangent carefully - touches curve at one point only. State what gradient represents'
WHERE id = 'a7ec71fc-574c-4988-9f71-e5d80c9378bf';

-- RATIO, PROPORTION AND RATES OF CHANGE MODULE
UPDATE course_lessons SET description = '✅ INCLUDE: Simplifying ratios, equivalent ratios, sharing in a ratio, ratio problems, writing ratios from context, 1:n and n:1 form
❌ EXCLUDE: Continued ratios beyond three parts, complex ratio algebra
🎯 FOCUS: Finding unit amounts, scaling ratios, working with three-part ratios, comparing ratios
📝 EXAM TIP: To share amount A in ratio m:n, each part = A÷(m+n), then multiply by m and n'
WHERE id = 'd3ae5687-e6ff-4ca4-aa6b-264321806000';

UPDATE course_lessons SET description = '✅ INCLUDE: Direct proportion, inverse proportion, recognising proportional relationships, proportion problems in context, unitary method
❌ EXCLUDE: Partial proportions, joint variation
🎯 FOCUS: Direct: as one increases, other increases. Inverse: as one increases, other decreases
📝 EXAM TIP: Direct proportion: find value of 1 unit first. Inverse proportion: multiply to find constant'
WHERE id = '785243d7-01b7-4b5a-9d19-78dcfeb353e3';

UPDATE course_lessons SET description = '✅ INCLUDE: y ∝ x (direct), y ∝ 1/x (inverse), y ∝ x², y ∝ √x, y ∝ 1/x², finding constant of proportionality, forming and using equations
❌ EXCLUDE: Partial variation, complex power relationships
🎯 FOCUS: Writing y = kx, y = k/x etc., finding k from given values, using equation to find unknowns
📝 EXAM TIP: y ∝ x means y = kx. Find k using given values, then use to find unknowns'
WHERE id = '76dff2f9-5d6e-493e-aed6-22d8bcbe7b0e';

UPDATE course_lessons SET description = '✅ INCLUDE: Percentage of amount, percentage increase/decrease, reverse percentages, expressing as percentage, percentage change
❌ EXCLUDE: Compounding beyond simple cases (covered separately)
🎯 FOCUS: Finding percentage of amount, calculating % change, working backwards from final amount
📝 EXAM TIP: % change = (change/original) × 100. For reverse %, if price after 20% increase is £60, original = 60÷1.2'
WHERE id = '690592f0-b9d0-4b4a-b17a-6ece11bfc192';

UPDATE course_lessons SET description = '✅ INCLUDE: Compound interest, depreciation, exponential growth formula, repeated percentage change, finding number of periods
❌ EXCLUDE: Continuous compounding, natural exponential e
🎯 FOCUS: Using multiplier method (1.05 for 5% increase), n years formula: original × (multiplier)^n
📝 EXAM TIP: For compound interest: A = P(1 + r/100)^n. For depreciation use (1 - r/100)^n'
WHERE id = '735e8742-618b-4de1-a31f-595001bef883';

UPDATE course_lessons SET description = '✅ INCLUDE: Metric conversions (length, mass, capacity), area and volume conversions, time conversions, converting between metric and imperial
❌ EXCLUDE: Obscure imperial units, dimensional analysis
🎯 FOCUS: km↔m↔cm↔mm, kg↔g, litres↔ml, cm²↔m² (×10000), cm³↔m³ (×1000000)
📝 EXAM TIP: For area: 1m² = 10000cm² (100×100). For volume: 1m³ = 1000000cm³ (100×100×100)'
WHERE id = '68ec5292-7752-4f36-b0ea-3cebc0319215';

UPDATE course_lessons SET description = '✅ INCLUDE: Speed = distance/time, density = mass/volume, pressure = force/area, converting units, compound measure problems
❌ EXCLUDE: Fluid dynamics, stress-strain calculations
🎯 FOCUS: Rearranging formulas (D=S×T, M=D×V, F=P×A), unit consistency, real-world applications
📝 EXAM TIP: Use formula triangles if helpful. Always check units match (e.g., m/s not km/h if distance in m)'
WHERE id = 'e1a2a68f-a138-4dfc-b800-c6e399e66de5';

-- GEOMETRY AND MEASURES MODULE
UPDATE course_lessons SET description = '✅ INCLUDE: Angle facts (on line, at point, vertically opposite), angles in triangles, angles in quadrilaterals, angle notation
❌ EXCLUDE: Non-Euclidean geometry, formal geometric proofs
🎯 FOCUS: Identifying angle relationships, using correct vocabulary, giving reasons in angle calculations
📝 EXAM TIP: Always state the reason: "angles on a straight line = 180°", "vertically opposite angles are equal"'
WHERE id = '6e99898f-5947-45d5-991c-08303b1fe2f4';

UPDATE course_lessons SET description = '✅ INCLUDE: Corresponding angles, alternate angles, co-interior/allied angles, angles with parallel lines problems, identifying parallel lines
❌ EXCLUDE: Proofs involving parallel lines, projective geometry
🎯 FOCUS: Recognising F-angles (corresponding), Z-angles (alternate), C-angles (co-interior = 180°)
📝 EXAM TIP: Corresponding = same position at each intersection. Alternate = opposite sides of transversal'
WHERE id = 'b5e89c37-63fd-416f-8be7-5f1c4abab638';

UPDATE course_lessons SET description = '✅ INCLUDE: Multi-step angle problems, angles in polygons, interior angle sum = (n-2)×180°, exterior angles sum = 360°, regular polygon angles
❌ EXCLUDE: Inscribed angle theorems beyond circles, complex constructions
🎯 FOCUS: Finding interior and exterior angles of regular polygons, multi-step problem solving with reasons
📝 EXAM TIP: Each exterior angle of regular n-gon = 360°/n. Interior + exterior = 180° at each vertex'
WHERE id = '0b2e73b7-74fb-4f8a-a91a-39746a425a49';

UPDATE course_lessons SET description = '✅ INCLUDE: Properties of special quadrilaterals, polygon properties, diagonal properties, symmetry of shapes
❌ EXCLUDE: Advanced polygon theorems, tessellation proofs
🎯 FOCUS: Knowing properties of square, rectangle, parallelogram, rhombus, trapezium, kite
📝 EXAM TIP: Learn properties: parallelogram has 2 pairs of parallel sides, opposite angles equal, diagonals bisect'
WHERE id = 'ab8f46d5-3d75-4dc9-8d70-d47d64de070d';

UPDATE course_lessons SET description = '✅ INCLUDE: Perimeter of 2D shapes, area of triangles, area of parallelograms, area of trapeziums, area of compound shapes
❌ EXCLUDE: Integration for area, areas of sectors (covered separately)
🎯 FOCUS: Area formulas, breaking compound shapes into simpler shapes, correct units (cm², m²)
📝 EXAM TIP: Triangle = ½bh, Parallelogram = bh, Trapezium = ½(a+b)h. Always check units'
WHERE id = '8cdba0c9-d4e6-4f7f-95b7-aacce8fc1bd4';

UPDATE course_lessons SET description = '✅ INCLUDE: Circumference = πd = 2πr, area = πr², arc length, sector area, segments
❌ EXCLUDE: Radians, integration involving circles
🎯 FOCUS: Using correct formula, finding fractions of circles for sectors, leaving answers in terms of π
📝 EXAM TIP: Arc length = (θ/360) × 2πr, Sector area = (θ/360) × πr². Use π button or leave as π'
WHERE id = 'bf6f6e61-52c0-4e5f-8f86-e3e8d7b8c6d3';

UPDATE course_lessons SET description = '✅ INCLUDE: Surface area of cuboids, prisms, cylinders, cones, spheres, pyramids, composite 3D shapes
❌ EXCLUDE: Surface integrals, minimal surfaces
🎯 FOCUS: Identifying faces, using nets to find surface area, formula for curved surfaces
📝 EXAM TIP: Cylinder curved SA = 2πrh, Cone curved SA = πrl, Sphere SA = 4πr². Add flat faces separately'
WHERE id = 'd0d1e2f3-a4b5-c6d7-e8f9-0a1b2c3d4e5f';

UPDATE course_lessons SET description = '✅ INCLUDE: Volume of cuboids, prisms, cylinders, cones, spheres, pyramids, frustums
❌ EXCLUDE: Volume integrals, Cavalieri principle proofs
🎯 FOCUS: Prism = area of cross-section × length, Cone = ⅓πr²h, Sphere = (4/3)πr³, Pyramid = ⅓ × base × h
📝 EXAM TIP: Prism volume = cross-section area × length. Cylinder is a circular prism: V = πr²h'
WHERE id = 'e1f2a3b4-c5d6-e7f8-9a0b-1c2d3e4f5a6b';

UPDATE course_lessons SET description = '✅ INCLUDE: Pythagoras theorem a² + b² = c², finding hypotenuse, finding shorter side, 3D Pythagoras, Pythagorean triples
❌ EXCLUDE: Proof of Pythagoras theorem, non-right-angled applications
🎯 FOCUS: Identifying hypotenuse, setting up equation correctly, exact vs decimal answers
📝 EXAM TIP: Hypotenuse is ALWAYS opposite the right angle and is the longest side. c² = a² + b²'
WHERE id = '2e3f4a5b-6c7d-8e9f-0a1b-2c3d4e5f6a7b';

UPDATE course_lessons SET description = '✅ INCLUDE: SOHCAHTOA, finding angles using inverse trig, finding sides using trig ratios, choosing correct ratio, exact trig values
❌ EXCLUDE: Trig identities, radians, trig graphs (covered separately)
🎯 FOCUS: Labelling O, A, H correctly, choosing sin/cos/tan, using inverse functions on calculator
📝 EXAM TIP: SOH: sin = O/H, CAH: cos = A/H, TOA: tan = O/A. Label sides FIRST before choosing ratio'
WHERE id = '3f4a5b6c-7d8e-9f0a-1b2c-3d4e5f6a7b8c';

UPDATE course_lessons SET description = '✅ INCLUDE: Exact values of sin, cos, tan for 0°, 30°, 45°, 60°, 90°, using exact values in calculations
❌ EXCLUDE: Deriving exact values, trig values beyond 90°
🎯 FOCUS: Memorising key values, recognising when to use them, leaving answers in surd form
📝 EXAM TIP: sin30°=½, cos30°=√3/2, tan30°=1/√3, sin45°=cos45°=√2/2, tan45°=1, sin60°=√3/2, cos60°=½'
WHERE id = '4a5b6c7d-8e9f-0a1b-2c3d-4e5f6a7b8c9d';

UPDATE course_lessons SET description = '✅ INCLUDE: Sine rule a/sinA = b/sinB = c/sinC, cosine rule a² = b² + c² - 2bc cosA, choosing correct rule, ambiguous case of sine rule
❌ EXCLUDE: Spherical trigonometry, complex triangle problems
🎯 FOCUS: When to use sine rule (angle-side pairs) vs cosine rule (SAS or SSS), area = ½ab sinC
📝 EXAM TIP: Use sine rule when you have opposite angle-side pair. Use cosine rule for SAS or SSS'
WHERE id = '5b6c7d8e-9f0a-1b2c-3d4e-5f6a7b8c9d0e';

UPDATE course_lessons SET description = '✅ INCLUDE: Recognising congruent shapes, conditions for congruence (SSS, SAS, ASA, RHS), proving triangles congruent
❌ EXCLUDE: Congruence in non-Euclidean geometry
🎯 FOCUS: Identifying which condition applies, writing congruence proofs, corresponding sides/angles
📝 EXAM TIP: SSS: 3 sides equal. SAS: 2 sides + included angle. ASA: 2 angles + included side. RHS: right angle, hypotenuse, side'
WHERE id = '6c7d8e9f-0a1b-2c3d-4e5f-6a7b8c9d0e1f';

UPDATE course_lessons SET description = '✅ INCLUDE: Similar shapes, scale factors, corresponding sides/angles, finding missing lengths, area and volume scale factors
❌ EXCLUDE: Similarity in transformations theory
🎯 FOCUS: If SF = k, then areas scale by k², volumes scale by k³, identifying similar triangles
📝 EXAM TIP: For similar shapes: length SF = k, area SF = k², volume SF = k³. Work backwards if given area/volume'
WHERE id = '7d8e9f0a-1b2c-3d4e-5f6a-7b8c9d0e1f2a';

UPDATE course_lessons SET description = '✅ INCLUDE: Translation by vectors, reflection in lines, rotation about a point, enlargement from centre with scale factor, combining transformations
❌ EXCLUDE: Matrix representations of transformations, affine transformations
🎯 FOCUS: Describing transformations fully, performing transformations accurately, negative and fractional scale factors
📝 EXAM TIP: Translation: state vector. Reflection: state mirror line. Rotation: state centre, angle, direction. Enlargement: state centre, scale factor'
WHERE id = '8e9f0a1b-2c3d-4e5f-6a7b-8c9d0e1f2a3b';

UPDATE course_lessons SET description = '✅ INCLUDE: Column vectors, adding/subtracting vectors, scalar multiplication, magnitude, parallel vectors, position vectors
❌ EXCLUDE: 3D vectors, dot product, cross product, vector spaces
🎯 FOCUS: Vector notation, combining vectors, expressing position vectors, proving points are collinear
📝 EXAM TIP: Parallel vectors are scalar multiples of each other. |a| = √(x² + y²) for magnitude'
WHERE id = '9f0a1b2c-3d4e-5f6a-7b8c-9d0e1f2a3b4c';

UPDATE course_lessons SET description = '✅ INCLUDE: Constructing perpendicular bisector, angle bisector, perpendicular from point to line, perpendicular from point on line, triangles from given information
❌ EXCLUDE: Advanced compass constructions, origami geometry
🎯 FOCUS: Using compasses and ruler only, keeping construction arcs visible, accuracy
📝 EXAM TIP: Keep all construction arcs visible - they show your method. Use sharp pencil for accuracy'
WHERE id = '0a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d';

UPDATE course_lessons SET description = '✅ INCLUDE: Drawing loci (equidistant from point, line, two points, two lines), loci problems, regions satisfying conditions
❌ EXCLUDE: Parametric curves, complex locus problems
🎯 FOCUS: Circle for equidistant from point, perpendicular bisector for equidistant from two points, angle bisector for equidistant from two lines
📝 EXAM TIP: Locus of points equidistant from two points = perpendicular bisector of line joining them'
WHERE id = '1b2c3d4e-5f6a-7b8c-9d0e-1f2a3b4c5d6e';

UPDATE course_lessons SET description = '✅ INCLUDE: Scale drawings, map scales, using scales to find real distances, bearings from scale drawings
❌ EXCLUDE: Technical drawing, orthographic projection
🎯 FOCUS: Converting between scale drawing and real measurements, measuring accurately, appropriate scales
📝 EXAM TIP: Scale 1:50000 means 1cm on map = 50000cm = 500m = 0.5km in real life'
WHERE id = '2c3d4e5f-6a7b-8c9d-0e1f-2a3b4c5d6e7f';

UPDATE course_lessons SET description = '✅ INCLUDE: Three-figure bearings, measuring bearings, calculating bearings, bearing problems, back bearings
❌ EXCLUDE: Great circle bearings, navigation mathematics
🎯 FOCUS: Measuring clockwise from North, three figures (e.g., 045° not 45°), finding return bearings
📝 EXAM TIP: Bearings are ALWAYS 3 figures, measured clockwise from North. Back bearing = bearing ± 180°'
WHERE id = '3d4e5f6a-7b8c-9d0e-1f2a-3b4c5d6e7f8a';

-- PROBABILITY MODULE
UPDATE course_lessons SET description = '✅ INCLUDE: Probability scale 0-1, calculating simple probability, listing outcomes, sample space diagrams, complement rule P(not A) = 1 - P(A)
❌ EXCLUDE: Axioms of probability, measure theory
🎯 FOCUS: P(event) = favourable outcomes / total outcomes, understanding certain (1) vs impossible (0)
📝 EXAM TIP: Probability is always between 0 and 1. Can be fraction, decimal or percentage'
WHERE id = '4e5f6a7b-8c9d-0e1f-2a3b-4c5d6e7f8a9b';

UPDATE course_lessons SET description = '✅ INCLUDE: Expected frequency, comparing expected vs actual, relative frequency as probability estimate, improving estimates with more trials
❌ EXCLUDE: Law of large numbers proof, statistical inference
🎯 FOCUS: Expected frequency = probability × number of trials, using experimental data to estimate probability
📝 EXAM TIP: Relative frequency = frequency ÷ total trials. More trials = more reliable estimate'
WHERE id = '5f6a7b8c-9d0e-1f2a-3b4c-5d6e7f8a9b0c';

UPDATE course_lessons SET description = '✅ INCLUDE: AND rule for independent events P(A and B) = P(A) × P(B), OR rule for mutually exclusive P(A or B) = P(A) + P(B), combined events
❌ EXCLUDE: Conditional probability beyond tree diagrams, Bayes theorem
🎯 FOCUS: When to multiply (and) vs add (or), identifying independent and mutually exclusive events
📝 EXAM TIP: AND = multiply, OR (mutually exclusive) = add. "Both" or "all" means multiply'
WHERE id = '6a7b8c9d-0e1f-2a3b-4c5d-6e7f8a9b0c1d';

UPDATE course_lessons SET description = '✅ INCLUDE: Drawing tree diagrams, reading tree diagrams, probability from tree diagrams, with and without replacement
❌ EXCLUDE: Decision trees, Bayesian networks
🎯 FOCUS: Multiplying along branches, adding final probabilities, adjusting for without replacement
📝 EXAM TIP: Multiply along branches to get final outcome probability. Check all final probabilities sum to 1'
WHERE id = '7b8c9d0e-1f2a-3b4c-5d6e-7f8a9b0c1d2e';

UPDATE course_lessons SET description = '✅ INCLUDE: Two-way tables, Venn diagrams for probability, set notation (∪, ∩, ′), reading probabilities from diagrams
❌ EXCLUDE: Three-set Venn diagrams beyond basic, inclusion-exclusion principle
🎯 FOCUS: Filling in Venn diagrams systematically, using complement notation, calculating probabilities
📝 EXAM TIP: P(A∪B) = P(A) + P(B) - P(A∩B). Start Venn diagrams by filling in the intersection first'
WHERE id = '8c9d0e1f-2a3b-4c5d-6e7f-8a9b0c1d2e3f';

-- STATISTICS MODULE
UPDATE course_lessons SET description = '✅ INCLUDE: Mean, median, mode, range, finding averages from frequency tables, comparing distributions using averages
❌ EXCLUDE: Geometric mean, harmonic mean, weighted averages
🎯 FOCUS: Calculating each average correctly, choosing appropriate average for context, interpreting range
📝 EXAM TIP: Mean = total ÷ count, Median = middle value (order first!), Mode = most common, Range = largest - smallest'
WHERE id = '9d0e1f2a-3b4c-5d6e-7f8a-9b0c1d2e3f4a';

UPDATE course_lessons SET description = '✅ INCLUDE: Mean from grouped frequency tables using midpoints, modal class, class containing median, estimated range
❌ EXCLUDE: Interpolation for exact median, ogive methods
🎯 FOCUS: Finding midpoints of classes, multiplying midpoint × frequency, dividing by total frequency
📝 EXAM TIP: For grouped data: estimated mean = Σ(midpoint × frequency) ÷ total frequency'
WHERE id = '0e1f2a3b-4c5d-6e7f-8a9b-0c1d2e3f4a5b';

UPDATE course_lessons SET description = '✅ INCLUDE: Bar charts, pie charts, pictograms, line graphs, dual bar charts, appropriate chart selection
❌ EXCLUDE: 3D charts, advanced data visualisation
🎯 FOCUS: Drawing charts accurately, choosing appropriate chart for data type, interpreting charts
📝 EXAM TIP: Pie charts: angle = (frequency ÷ total) × 360°. Bar charts: equal width bars, gaps between'
WHERE id = '1f2a3b4c-5d6e-7f8a-9b0c-1d2e3f4a5b6c';

UPDATE course_lessons SET description = '✅ INCLUDE: Histograms with unequal class widths, frequency density = frequency ÷ class width, drawing and interpreting histograms
❌ EXCLUDE: Kernel density estimation, continuous distributions
🎯 FOCUS: Using frequency density for y-axis, calculating frequencies from histogram, comparing groups
📝 EXAM TIP: Area of bar = frequency (when using frequency density). Always use frequency density for y-axis'
WHERE id = '2a3b4c5d-6e7f-8a9b-0c1d-2e3f4a5b6c7d';

UPDATE course_lessons SET description = '✅ INCLUDE: Cumulative frequency tables, cumulative frequency graphs (ogives), reading median from graph, finding quartiles, interquartile range
❌ EXCLUDE: Percentiles beyond quartiles, cumulative distribution functions
🎯 FOCUS: Plotting cumulative frequency against upper class boundary, reading Q1, Q2 (median), Q3
📝 EXAM TIP: Median at n/2, LQ at n/4, UQ at 3n/4 on cumulative frequency axis. IQR = UQ - LQ'
WHERE id = '3b4c5d6e-7f8a-9b0c-1d2e-3f4a5b6c7d8e';

UPDATE course_lessons SET description = '✅ INCLUDE: Drawing box plots, reading box plots, comparing box plots, identifying outliers, five-number summary
❌ EXCLUDE: Modified box plots, multiple outlier rules
🎯 FOCUS: Min, LQ, median, UQ, max, comparing distributions using box plots, skewness
📝 EXAM TIP: Box plots show: minimum, lower quartile, median, upper quartile, maximum. Width of box = IQR'
WHERE id = '4c5d6e7f-8a9b-0c1d-2e3f-4a5b6c7d8e9f';

UPDATE course_lessons SET description = '✅ INCLUDE: Drawing scatter graphs, describing correlation (positive, negative, none), strength of correlation, line of best fit, using line for predictions
❌ EXCLUDE: Correlation coefficient calculation, regression analysis
🎯 FOCUS: Plotting points accurately, drawing line of best fit by eye, interpolation vs extrapolation
📝 EXAM TIP: Line of best fit should pass through the mean point (x̄, ȳ). Extrapolation is less reliable'
WHERE id = '5d6e7f8a-9b0c-1d2e-3f4a-5b6c7d8e9f0a';

UPDATE course_lessons SET description = '✅ INCLUDE: Comparing data sets, using appropriate statistics, limitations of averages, misleading statistics, sampling methods
❌ EXCLUDE: Statistical tests, hypothesis testing, confidence intervals
🎯 FOCUS: Choosing mean/median/mode appropriately, comparing using average AND spread, bias in sampling
📝 EXAM TIP: When comparing: quote values and say which is higher/lower and what this means in context'
WHERE id = '6e7f8a9b-0c1d-2e3f-4a5b-6c7d8e9f0a1b';
