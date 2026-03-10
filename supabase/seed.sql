-- ============================================================
-- Regional Wire — Demo Seed Data
-- Run in Supabase SQL Editor after running 001_schema.sql
-- NOTE: Users must be created via Supabase Auth (see README).
--       This seed covers all non-auth tables.
-- ============================================================

-- ============================================================
-- ORGANIZATIONS (6 regional newsrooms, all approved)
-- ============================================================

INSERT INTO organizations (id, name, slug, website_url, email_domain, status, description, contact_emails) VALUES
  (
    '11111111-0000-0000-0000-000000000001',
    'Valley Tribune',
    'valley-tribune',
    'https://valleytribune.com',
    'valleytribune.com',
    'approved',
    'Independent daily newspaper serving the greater valley region since 1947. Covering local government, agriculture, and community news.',
    ARRAY['editor@valleytribune.com', 'news@valleytribune.com']
  ),
  (
    '11111111-0000-0000-0000-000000000002',
    'Riverside Gazette',
    'riverside-gazette',
    'https://riversidegazette.net',
    'riversidegazette.net',
    'approved',
    'Your source for Riverside County news, sports, and opinion. Family-owned and operated for three generations.',
    ARRAY['tips@riversidegazette.net', 'editor@riversidegazette.net']
  ),
  (
    '11111111-0000-0000-0000-000000000003',
    'Mountain View Weekly',
    'mountain-view-weekly',
    'https://mountainviewweekly.org',
    'mountainviewweekly.org',
    'approved',
    'Community journalism for mountain communities. Published every Thursday. Nonprofit, reader-supported.',
    ARRAY['info@mountainviewweekly.org']
  ),
  (
    '11111111-0000-0000-0000-000000000004',
    'Coastal Current',
    'coastal-current',
    'https://coastalcurrent.com',
    'coastalcurrent.com',
    'approved',
    'Digital-first newsroom covering coastal towns, fishing industry, tourism, and environmental issues.',
    ARRAY['news@coastalcurrent.com', 'advertising@coastalcurrent.com']
  ),
  (
    '11111111-0000-0000-0000-000000000005',
    'Highpoint Herald',
    'highpoint-herald',
    'https://highpointherald.com',
    'highpointherald.com',
    'approved',
    'Serving the Highpoint metropolitan area and surrounding townships with award-winning investigative journalism.',
    ARRAY['editor@highpointherald.com', 'tips@highpointherald.com']
  ),
  (
    '11111111-0000-0000-0000-000000000006',
    'Prairie Post',
    'prairie-post',
    'https://prairiepost.news',
    'prairiepost.news',
    'approved',
    'Agriculture, rural life, and small-town stories from the heartland. Est. 2008.',
    ARRAY['desk@prairiepost.news']
  );


-- ============================================================
-- STORIES (20 stories across orgs)
-- ============================================================

INSERT INTO stories (id, organization_id, title, byline, body_html, body_plain, canonical_url, slug, summary, special_instructions, status, source, published_at, created_at) VALUES

  -- Valley Tribune stories
  (
    '22222222-0000-0000-0000-000000000001',
    '11111111-0000-0000-0000-000000000001',
    'County Approves $48M Water Infrastructure Bond',
    'Maria Vasquez',
    '<p>The Valley County Board of Supervisors voted 4-1 Tuesday to place a $48 million water infrastructure bond on the November ballot, a measure supporters say is critical to replacing aging pipes that have caused three major main breaks this year.</p><p>The bond, if approved by voters, would fund replacement of approximately 140 miles of water mains installed before 1960, upgrade two pump stations, and expand recycled water capacity at the regional treatment plant.</p><p>"We have been kicking this can down the road for 20 years," said Board Chair Linda Okonkwo. "The cost of inaction is higher than the cost of action."</p><p>The lone dissenting vote came from Supervisor Dale Hatch, who argued the measure should be delayed until an independent audit of the Water District''s spending is complete. "I''m not opposed to infrastructure investment," Hatch said. "I''m opposed to writing a blank check before we understand where the last dollars went."</p><p>If the measure passes in November, property owners would pay an estimated $28 per $100,000 of assessed value annually. The average homeowner would pay roughly $56 per year.</p>',
    'The Valley County Board of Supervisors voted 4-1 Tuesday to place a $48 million water infrastructure bond on the November ballot, a measure supporters say is critical to replacing aging pipes that have caused three major main breaks this year.',
    'https://valleytribune.com/news/county-approves-48m-water-infrastructure-bond',
    'county-approves-48m-water-infrastructure-bond',
    'County supervisors approve ballot measure to fund replacement of pre-1960 water mains and upgrade regional treatment facilities.',
    'High-resolution maps of the affected infrastructure zones available upon request. Contact editor@valleytribune.com.',
    'available',
    'manual',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days'
  ),

  (
    '22222222-0000-0000-0000-000000000002',
    '11111111-0000-0000-0000-000000000001',
    'Valley Unified Schools See Record Enrollment Drop',
    'James Osei',
    '<p>Valley Unified School District enrollment fell by 1,240 students this fall — its steepest single-year decline in 30 years — as demographic shifts and continued post-pandemic homeschool growth reshape the local education landscape.</p><p>The district now serves 18,470 students, down from a peak of 23,800 in 2019. Officials say declining birth rates, outmigration of young families, and a persistent 8% homeschool rate are compounding factors.</p><p>Superintendent Dr. Angela Pierce said the district is projecting further declines through 2027 and will present a facilities consolidation plan to the school board in January. "We have buildings designed for 1,200 students operating at 600," she said. "That is not financially or educationally sustainable."</p><p>The enrollment drop triggers a reduction in state per-pupil funding estimated at $7.2 million for the current fiscal year.</p>',
    'Valley Unified School District enrollment fell by 1,240 students this fall — its steepest single-year decline in 30 years.',
    'https://valleytribune.com/education/valley-unified-schools-record-enrollment-drop',
    'valley-unified-schools-record-enrollment-drop',
    'Valley Unified loses 1,240 students in one year, triggering $7.2M funding gap and likely school consolidations.',
    NULL,
    'available',
    'manual',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '5 days'
  ),

  (
    '22222222-0000-0000-0000-000000000003',
    '11111111-0000-0000-0000-000000000001',
    'Proposed Highway 12 Widening Draws Hundreds to Public Meeting',
    'Maria Vasquez',
    '<p>More than 300 residents packed the Valley Community Center on Monday to weigh in on a proposed widening of Highway 12 between Millerton and the county line — a project that has split the community between commuters seeking relief and homeowners fearing displacement.</p><p>The state Department of Transportation''s preferred alternative would add a travel lane in each direction and construct a new interchange at Orchard Road. The project would require the purchase of 42 residential and commercial properties through eminent domain.</p><p>CalTrans project manager Beth Solari said construction would not begin until 2028 at the earliest, pending environmental review. The estimated cost has risen to $340 million from an initial 2021 estimate of $210 million.</p>',
    'More than 300 residents packed the Valley Community Center on Monday to weigh in on a proposed widening of Highway 12.',
    'https://valleytribune.com/transportation/highway-12-widening-public-meeting',
    'highway-12-widening-public-meeting',
    'CalTrans highway expansion plan draws large crowd; 42 properties face eminent domain.',
    NULL,
    'available',
    'manual',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
  ),

  -- Riverside Gazette stories
  (
    '22222222-0000-0000-0000-000000000004',
    '11111111-0000-0000-0000-000000000002',
    'Riverside Hospital Announces ER Closure, Citing Staffing Crisis',
    'Patricia Nguyen',
    '<p>Riverside General Hospital will close its emergency department overnight between 11 p.m. and 7 a.m. starting next month, hospital administrators announced Wednesday, citing an inability to staff the unit amid a regional nursing shortage.</p><p>The closure affects the only ER within 25 miles of the Eastside and Millbrook neighborhoods. Patients requiring emergency care during overnight hours will be redirected to County Medical Center, a 34-minute drive under normal conditions.</p><p>Hospital CEO Marcus Webb said the decision was made after 18 months of recruiting efforts failed to fill 14 registered nurse vacancies. "This is not a decision we make lightly," Webb said. "It is the responsible choice given our inability to guarantee safe staffing."</p><p>The county''s emergency medical services director, Pamela Ortega, said her office is working with the hospital to pre-position an additional ambulance unit in the affected area to reduce transport times.</p><p>State Sen. Carolyn Drake called the closure "unacceptable" and said she would introduce legislation next session to address rural and suburban hospital staffing shortfalls.</p>',
    'Riverside General Hospital will close its emergency department overnight between 11 p.m. and 7 a.m. starting next month, hospital administrators announced Wednesday.',
    'https://riversidegazette.net/health/riverside-hospital-er-overnight-closure',
    'riverside-hospital-er-overnight-closure',
    'Riverside General closes ER overnight due to 14 unfilled nursing vacancies, leaving Eastside without nearby emergency care.',
    'Story includes comment from state senator. Follow-up coverage planned for Tuesday board meeting.',
    'available',
    'manual',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days'
  ),

  (
    '22222222-0000-0000-0000-000000000005',
    '11111111-0000-0000-0000-000000000002',
    'Downtown Riverside Farmers Market Expands to Year-Round Schedule',
    'Kevin Albright',
    '<p>After a two-year pilot, the Downtown Riverside Farmers Market will operate year-round beginning in January, the Riverside Business Improvement District announced Thursday.</p><p>The market, which has operated Saturdays from April through October since 2021, will add a Wednesday afternoon market from November through March. Forty-two vendors have signed on for the expanded schedule, including eight new vendors offering specialty foods, artisan crafts, and locally roasted coffee.</p><p>"The pilot proved that our community wants this, even in February," said BID executive director Susan Park. "Vendor sales in our fall extension last year exceeded projections by 30 percent."</p>',
    'After a two-year pilot, the Downtown Riverside Farmers Market will operate year-round beginning in January.',
    'https://riversidegazette.net/business/farmers-market-year-round-expansion',
    'farmers-market-year-round-expansion',
    'Farmers market expands to year-round operation with Wednesday winter market, 42 vendors signed on.',
    NULL,
    'available',
    'manual',
    NOW() - INTERVAL '6 days',
    NOW() - INTERVAL '6 days'
  ),

  (
    '22222222-0000-0000-0000-000000000006',
    '11111111-0000-0000-0000-000000000002',
    'Riverside County DA Charges Three in Unemployment Fraud Ring',
    'Patricia Nguyen',
    '<p>The Riverside County District Attorney''s office filed charges Thursday against three residents accused of orchestrating a $2.1 million unemployment insurance fraud scheme that exploited pandemic-era relief programs.</p><p>Defendants Carlos Mendez, 44, Aisha Thomas, 38, and Robert Fink, 51, allegedly submitted fraudulent claims on behalf of more than 400 individuals between 2020 and 2022, collecting fees of up to $800 per claim.</p><p>The DA''s office said the investigation, conducted jointly with the state Employment Development Department and the FBI, took 18 months and involved analysis of more than 14,000 financial transactions.</p>',
    'The Riverside County District Attorney''s office filed charges Thursday against three residents accused of orchestrating a $2.1 million unemployment insurance fraud scheme.',
    'https://riversidegazette.net/crime/da-charges-three-unemployment-fraud-ring',
    'da-charges-three-unemployment-fraud-ring',
    'Three charged in $2.1M unemployment fraud ring that submitted fake claims for 400+ people during pandemic.',
    NULL,
    'available',
    'manual',
    NOW() - INTERVAL '4 days',
    NOW() - INTERVAL '4 days'
  ),

  -- Mountain View Weekly stories
  (
    '22222222-0000-0000-0000-000000000007',
    '11111111-0000-0000-0000-000000000003',
    'Forest Service Proposes Closing 12 Miles of Backcountry Trails',
    'Elena Briggs',
    '<p>The Stanislaus National Forest is proposing to close 12 miles of backcountry trails in the Summit Ridge area to allow habitat recovery for the Sierra Nevada red fox, a federally threatened species documented in the area for the first time since 1976.</p><p>The closure, outlined in a draft environmental assessment released this week, would affect trails popular with hikers, mountain bikers, and equestrians between June and October each year — the peak season for both recreation and fox denning activity.</p><p>Forest ecologist Dr. Ramon Castillo said trail cameras captured images of a mated pair and at least two kits this past summer. "This is a significant conservation opportunity," Castillo said. "These animals are incredibly rare."</p><p>The public comment period runs through December 15. A final decision is expected in February.</p>',
    'The Stanislaus National Forest is proposing to close 12 miles of backcountry trails in the Summit Ridge area to allow habitat recovery for the Sierra Nevada red fox.',
    'https://mountainviewweekly.org/environment/forest-service-proposes-trail-closures-red-fox',
    'forest-service-proposes-trail-closures-red-fox',
    'Forest Service proposes seasonal trail closures to protect first Sierra Nevada red fox sighting in nearly 50 years.',
    NULL,
    'available',
    'manual',
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '7 days'
  ),

  (
    '22222222-0000-0000-0000-000000000008',
    '11111111-0000-0000-0000-000000000003',
    'Mountain View Council Rejects Short-Term Rental Cap',
    'Elena Briggs',
    '<p>The Mountain View Town Council voted 3-2 Wednesday night to reject a proposed ordinance that would have capped short-term vacation rentals at 15% of the housing units in any given neighborhood — a measure housing advocates said was necessary to preserve affordable long-term rental stock.</p><p>Council members who voted against the ordinance cited concerns about property rights and the economic contribution of tourism to the town''s economy. Mayor Tom Haley said he remained open to alternative approaches, including a registry and inspection program.</p><p>Short-term rentals have increased 240% in Mountain View over the past five years, according to data from AirDNA, a vacation rental analytics firm.</p>',
    'The Mountain View Town Council voted 3-2 Wednesday night to reject a proposed ordinance that would have capped short-term vacation rentals at 15% of housing units in any neighborhood.',
    'https://mountainviewweekly.org/housing/council-rejects-short-term-rental-cap',
    'council-rejects-short-term-rental-cap',
    'Council rejects rental cap despite 240% increase in vacation rentals over five years.',
    NULL,
    'available',
    'manual',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days'
  ),

  -- Coastal Current stories
  (
    '22222222-0000-0000-0000-000000000009',
    '11111111-0000-0000-0000-000000000004',
    'State Survey Finds Kelp Forest Coverage Down 74% in Decade',
    'Danielle Cruz',
    '<p>A new state survey of California''s Northern Coast finds kelp forest coverage has declined 74% over the past decade, driven by warming ocean temperatures, a collapse of sunflower sea stars — natural predators of sea urchins — and years of above-average storm surge.</p><p>The survey, conducted by the California Department of Fish and Wildlife using aerial and underwater drone technology, assessed 650 miles of coastline. The findings represent the most comprehensive kelp mapping effort since 2011.</p><p>Sea urchin barrens — areas where urchins have grazed away kelp holdfasts, leaving bare rock — now cover an estimated 95,000 acres of seafloor that was historically forested, the report found.</p><p>"The ecosystem is not recovering on its own," said CDFW marine ecologist Dr. Yuki Tanaka. "Without intervention, we are looking at a fundamentally altered coastline for decades."</p><p>Commercial fishing interests, particularly abalone and rockfish operations, say the kelp decline has contributed to significant catch reductions. The report recommends expanded urchin harvesting incentives and experimental kelp restoration at 20 pilot sites.</p>',
    'A new state survey of California''s Northern Coast finds kelp forest coverage has declined 74% over the past decade.',
    'https://coastalcurrent.com/environment/kelp-forest-decline-state-survey',
    'kelp-forest-decline-state-survey',
    'State survey documents 74% kelp forest loss on Northern Coast over 10 years, threatening fisheries and marine ecosystems.',
    'Full survey data and maps available from CDFW. We have a copy — contact news@coastalcurrent.com.',
    'available',
    'manual',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
  ),

  (
    '22222222-0000-0000-0000-000000000010',
    '11111111-0000-0000-0000-000000000004',
    'Port Commission Approves Cruise Ship Terminal Expansion',
    'Marcus Webb',
    '<p>The Coastal Port Commission voted unanimously Thursday to approve a $67 million expansion of the cruise ship terminal, a project officials say will allow the port to accommodate next-generation vessels and double the number of annual passenger arrivals.</p><p>The expansion includes a second berth capable of handling ships up to 330 meters in length, a new passenger processing facility, and expanded parking infrastructure. Construction is expected to begin in spring and take approximately 30 months.</p><p>Port Director Ana Reyes said the expansion is projected to generate $14 million in annual economic activity and support 180 full-time equivalent jobs once fully operational.</p>',
    'The Coastal Port Commission voted unanimously Thursday to approve a $67 million expansion of the cruise ship terminal.',
    'https://coastalcurrent.com/business/port-cruise-terminal-expansion-approved',
    'port-cruise-terminal-expansion-approved',
    'Port commission approves $67M terminal expansion to double cruise passenger capacity.',
    NULL,
    'available',
    'manual',
    NOW() - INTERVAL '4 days',
    NOW() - INTERVAL '4 days'
  ),

  (
    '22222222-0000-0000-0000-000000000011',
    '11111111-0000-0000-0000-000000000004',
    'Commercial Crabbing Season Delayed Three Weeks Due to Domoic Acid',
    'Danielle Cruz',
    '<p>The California Department of Public Health has delayed the opening of the commercial Dungeness crab season by three weeks after water sampling detected elevated domoic acid levels in crab tissue along the coast, state officials announced Friday.</p><p>The neurotoxin, produced by algae blooms, can cause amnesic shellfish poisoning in humans. The delay affects the Northern California commercial season, which was scheduled to open December 1.</p><p>Local crab boat operators say the delay will cost them an estimated $800,000 in lost revenue during what is typically the most lucrative period of the season. "December crabs are the best crabs," said fisherman Dale Kowalski. "Every week we wait is money we don''t get back."</p>',
    'California has delayed the commercial Dungeness crab season opening by three weeks after elevated domoic acid levels were detected in crab tissue.',
    'https://coastalcurrent.com/fishing/crab-season-delayed-domoic-acid',
    'crab-season-delayed-domoic-acid',
    'Commercial crab season delayed 3 weeks due to domoic acid, costing local fishermen an estimated $800K.',
    NULL,
    'available',
    'manual',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days'
  ),

  -- Highpoint Herald stories
  (
    '22222222-0000-0000-0000-000000000012',
    '11111111-0000-0000-0000-000000000005',
    'Highpoint Police Department Launches Civilian Review Board',
    'Sandra Kim',
    '<p>After two years of community advocacy and a contentious city council debate, Highpoint''s newly formed Civilian Police Review Board convened its inaugural meeting Wednesday, beginning its work with four pending use-of-force complaints against department officers.</p><p>The seven-member board, appointed by the city council in October, has authority to review complaints, subpoena records, and make non-binding recommendations to the police chief and city manager. Critics of the original proposal say the lack of disciplinary power weakens the board''s effectiveness.</p><p>"Non-binding is a start," said board chair Dr. Marcus Johnson, a retired judge. "Our credibility will be built on the thoroughness and impartiality of our investigations."</p><p>Police Chief David Torres said the department welcomed "an additional layer of accountability" and pledged full cooperation with records requests.</p>',
    'After two years of community advocacy, Highpoint''s Civilian Police Review Board convened its inaugural meeting Wednesday.',
    'https://highpointherald.com/government/highpoint-police-civilian-review-board-launches',
    'highpoint-police-civilian-review-board-launches',
    'New seven-member civilian board opens with four pending use-of-force complaints; lacks disciplinary authority.',
    NULL,
    'available',
    'manual',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days'
  ),

  (
    '22222222-0000-0000-0000-000000000013',
    '11111111-0000-0000-0000-000000000005',
    'City Council Approves Controversial Homeless Services Campus',
    'Roberto Alverez',
    '<p>The Highpoint City Council voted 5-2 early Thursday morning to approve a $12 million homeless services campus on a city-owned parcel on the west side, ending more than a year of community opposition centered on the site''s proximity to an elementary school.</p><p>The facility will include a 120-bed emergency shelter, a day services center offering mental health and substance use treatment, and a navigation center to help connect residents with permanent housing. It is expected to open in late 2027.</p><p>The two dissenting votes came from council members whose districts border the site. Both said they supported homeless services but opposed this specific location.</p><p>Nonprofit operator Harbor Light Services will manage the facility under a five-year contract with the city.</p>',
    'The Highpoint City Council voted 5-2 to approve a $12 million homeless services campus on the west side after more than a year of community opposition.',
    'https://highpointherald.com/government/city-council-approves-homeless-services-campus',
    'city-council-approves-homeless-services-campus',
    'Council approves $12M, 120-bed homeless shelter and services campus over neighborhood objections.',
    NULL,
    'available',
    'manual',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
  ),

  (
    '22222222-0000-0000-0000-000000000014',
    '11111111-0000-0000-0000-000000000005',
    'Highpoint Unified Teachers Strike After Contract Talks Collapse',
    'Sandra Kim',
    '<p>Teachers in the Highpoint Unified School District walked off the job Thursday after contract negotiations broke down over salary increases and class size limits, leaving more than 22,000 students without instruction as the district scrambled to arrange supervision.</p><p>The Highpoint Teachers Association is seeking a 14% salary increase over three years and binding class size caps at 28 students for elementary grades. The district''s last offer included an 8% increase and non-binding class size targets.</p><p>"We have been patient. We have bargained in good faith. We are done waiting," said HTA president Luz Morales at a rally of roughly 800 teachers and supporters outside district headquarters.</p><p>Superintendent Gerald Ross said the district could not afford the union''s demands without triggering layoffs. State mediators have been contacted, he said.</p>',
    'Teachers in Highpoint Unified walked off the job Thursday after contract negotiations broke down over salary increases and class size limits.',
    'https://highpointherald.com/education/highpoint-unified-teachers-strike',
    'highpoint-unified-teachers-strike',
    'Highpoint Unified teachers strike over 14% salary demand vs district''s 8% offer, affecting 22,000+ students.',
    'Breaking story — updates expected daily.',
    'available',
    'manual',
    NOW() - INTERVAL '12 hours',
    NOW() - INTERVAL '12 hours'
  ),

  -- Prairie Post stories
  (
    '22222222-0000-0000-0000-000000000015',
    '11111111-0000-0000-0000-000000000006',
    'Drought Forces Early Liquidation for Hundreds of Cattle Producers',
    'Dale Harding',
    '<p>Worsening drought conditions across the region have forced an estimated 400 cattle producers to liquidate herds earlier than planned this fall, according to data from the Regional Livestock Exchange, where sale volumes are running 38% above the five-year average.</p><p>Pasture conditions rated "poor to very poor" now cover 62% of the region, according to the latest USDA report. Many producers say they cannot afford the cost of hay and supplemental feed required to maintain herd size through what forecasters predict will be a dry winter.</p><p>"I''m selling cows I''ve had for 15 years," said Wayne Elstun, a third-generation rancher in Tanner County. "You don''t do that unless you have no choice."</p><p>Extension economists say the early liquidation could depress local cattle prices through spring and lead to reduced herd rebuilding in 2026, with effects that could last three to five years.</p>',
    'Worsening drought has forced an estimated 400 cattle producers to liquidate herds earlier than planned, with sale volumes 38% above the five-year average.',
    'https://prairiepost.news/agriculture/drought-forces-cattle-herd-liquidation',
    'drought-forces-cattle-herd-liquidation',
    'Drought pushes 400 cattle producers into early herd liquidation as pasture conditions hit 62% poor-to-very-poor.',
    NULL,
    'available',
    'manual',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '5 days'
  ),

  (
    '22222222-0000-0000-0000-000000000016',
    '11111111-0000-0000-0000-000000000006',
    'USDA Announces $18M in Conservation Easement Purchases',
    'Donna Petersen',
    '<p>The USDA Natural Resources Conservation Service announced Thursday it will purchase $18 million in conservation easements on approximately 28,000 acres of farmland and wetland in the region through its Agricultural Conservation Easement Program, protecting the land from development in perpetuity.</p><p>The easements will cover 47 parcels across six counties. Landowners voluntarily apply for the program and receive payments based on the difference between the land''s development value and its agricultural value.</p><p>NRCS state director Carol Webb said the purchases represent the largest single-year investment in the region under the program. "These acres are working landscapes," Webb said. "Protecting them protects the farm economy and the water that comes off them."</p>',
    'The USDA NRCS announced it will purchase $18 million in conservation easements covering approximately 28,000 acres of farmland and wetland.',
    'https://prairiepost.news/agriculture/usda-18m-conservation-easements',
    'usda-18m-conservation-easements',
    'USDA purchases $18M in conservation easements protecting 28,000 acres from development across six counties.',
    NULL,
    'available',
    'manual',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days'
  ),

  (
    '22222222-0000-0000-0000-000000000017',
    '11111111-0000-0000-0000-000000000006',
    'Grain Elevator Operator Files for Chapter 11 Amid Debt Crisis',
    'Dale Harding',
    '<p>Prairie Grain Cooperative, the region''s largest independent grain elevator operator with 11 facilities across four counties, filed for Chapter 11 bankruptcy protection Monday, listing $34 million in liabilities against $21 million in assets.</p><p>The filing comes after the cooperative failed to secure refinancing for loans taken on during a 2021 expansion that added three new elevator facilities. Grain prices have fallen roughly 22% since that expansion was planned.</p><p>CEO Thomas Wick said the cooperative would continue operating all 11 facilities during the reorganization and had secured debtor-in-possession financing to maintain grain handling through harvest. "Our first obligation is to the farmers who trusted us with their grain," Wick said.</p><p>The bankruptcy affects approximately 1,200 member-farmers who have grain currently stored at cooperative facilities.</p>',
    'Prairie Grain Cooperative, the region''s largest independent grain elevator operator, filed for Chapter 11 bankruptcy Monday, listing $34 million in liabilities.',
    'https://prairiepost.news/business/prairie-grain-cooperative-chapter-11',
    'prairie-grain-cooperative-chapter-11',
    'Major regional grain cooperative files Chapter 11 with $34M in debt, affecting 1,200 farmer-members.',
    'Sensitive story — verify with court filings before republishing financial figures. Case No. 24-cv-08812.',
    'available',
    'manual',
    NOW() - INTERVAL '8 days',
    NOW() - INTERVAL '8 days'
  ),

  -- One embargoed story
  (
    '22222222-0000-0000-0000-000000000018',
    '11111111-0000-0000-0000-000000000001',
    'Valley Tech Campus to Bring 2,400 Jobs, Governor to Announce',
    'Maria Vasquez',
    '<p>A major technology company is set to announce construction of a regional operations campus in Valley County that is expected to bring approximately 2,400 full-time jobs over five years, according to three sources with knowledge of the project who were not authorized to speak publicly.</p><p>Governor Janet Navarro is scheduled to make the announcement at a press conference at Valley Regional Airport on Tuesday. The company is expected to receive a package of state and local incentives totaling $180 million over 15 years.</p>',
    'A major technology company is set to announce construction of a regional operations campus in Valley County bringing approximately 2,400 jobs.',
    'https://valleytribune.com/business/tech-campus-valley-county-jobs',
    'tech-campus-valley-county-jobs',
    'Embargoed until Tuesday 10am — tech company to announce 2,400-job campus in Valley County.',
    'EMBARGOED until Tuesday at 10:00 a.m. Do not publish or broadcast before the governor''s press conference.',
    'embargoed',
    'manual',
    NOW() + INTERVAL '2 days',
    NOW() - INTERVAL '1 day'
  ),

  -- One withdrawn story
  (
    '22222222-0000-0000-0000-000000000019',
    '11111111-0000-0000-0000-000000000003',
    'Mountain View Council Member Resigns',
    'Elena Briggs',
    '<p>Mountain View Council Member Patricia Dunn announced her resignation Tuesday, citing personal health reasons. Her resignation is effective immediately.</p>',
    'Mountain View Council Member Patricia Dunn announced her resignation Tuesday, citing personal health reasons.',
    'https://mountainviewweekly.org/government/council-member-dunn-resigns',
    'council-member-dunn-resigns',
    'Council member resigns citing health reasons.',
    NULL,
    'withdrawn',
    'manual',
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '10 days'
  ),

  -- Feed-ingested story
  (
    '22222222-0000-0000-0000-000000000020',
    '11111111-0000-0000-0000-000000000002',
    'Riverside Unified Plans New STEM Academy for Fall',
    'Staff',
    '<p>Riverside Unified School District will open a dedicated STEM academy in September, serving 150 students in grades 9-12 with a project-based curriculum focused on engineering, computer science, and environmental science.</p><p>The academy will operate within Jefferson High School and draw students from across the district via a lottery application process opening in January.</p>',
    'Riverside Unified School District will open a dedicated STEM academy in September serving 150 students in grades 9-12.',
    'https://riversidegazette.net/education/riverside-unified-stem-academy-fall',
    'riverside-unified-stem-academy-fall',
    'Riverside Unified opens STEM academy for 150 students next fall with project-based curriculum.',
    NULL,
    'available',
    'feed',
    NOW() - INTERVAL '6 hours',
    NOW() - INTERVAL '6 hours'
  );


-- ============================================================
-- ORG FEEDS
-- ============================================================

INSERT INTO org_feeds (id, organization_id, feed_url, feed_type, last_polled_at, is_active) VALUES
  (
    '33333333-0000-0000-0000-000000000001',
    '11111111-0000-0000-0000-000000000002',
    'https://riversidegazette.net/feed.xml',
    'full_text',
    NOW() - INTERVAL '10 minutes',
    TRUE
  ),
  (
    '33333333-0000-0000-0000-000000000002',
    '11111111-0000-0000-0000-000000000004',
    'https://coastalcurrent.com/rss',
    'headline',
    NOW() - INTERVAL '10 minutes',
    TRUE
  ),
  (
    '33333333-0000-0000-0000-000000000003',
    '11111111-0000-0000-0000-000000000005',
    'https://highpointherald.com/rss/news',
    'full_text',
    NOW() - INTERVAL '25 minutes',
    TRUE
  ),
  (
    '33333333-0000-0000-0000-000000000004',
    '11111111-0000-0000-0000-000000000006',
    'https://prairiepost.news/feed',
    'headline',
    NOW() - INTERVAL '10 minutes',
    FALSE
  );


-- ============================================================
-- FEED HEADLINES (from headline-type feeds)
-- ============================================================

INSERT INTO feed_headlines (id, org_feed_id, organization_id, title, url, summary, published_at, guid) VALUES
  (
    '44444444-0000-0000-0000-000000000001',
    '33333333-0000-0000-0000-000000000002',
    '11111111-0000-0000-0000-000000000004',
    'Marina District Parking Overhaul Wins Planning Approval',
    'https://coastalcurrent.com/city/marina-parking-overhaul-planning-approval',
    'Planners approve elimination of minimum parking requirements in Marina District, allowing conversion of three surface lots to mixed-use development.',
    NOW() - INTERVAL '2 days',
    'coastal-marina-parking-2024-1201'
  ),
  (
    '44444444-0000-0000-0000-000000000002',
    '33333333-0000-0000-0000-000000000002',
    '11111111-0000-0000-0000-000000000004',
    'Surf Rescue Calls Up 40% This Season, Lifeguards Warn of Rip Currents',
    'https://coastalcurrent.com/safety/surf-rescue-calls-up-40-percent',
    'Lifeguard service logs 340 rescues through November, highest since 2018, amid persistent rip current conditions.',
    NOW() - INTERVAL '4 days',
    'coastal-surf-rescue-2024-1129'
  ),
  (
    '44444444-0000-0000-0000-000000000003',
    '33333333-0000-0000-0000-000000000002',
    '11111111-0000-0000-0000-000000000004',
    'Coastal Conservancy Awards $2.4M for Dune Restoration',
    'https://coastalcurrent.com/environment/coastal-conservancy-dune-restoration-grant',
    'State grant will fund restoration of 180 acres of degraded coastal dune habitat across three sites.',
    NOW() - INTERVAL '7 days',
    'coastal-dune-restoration-2024-1126'
  ),
  (
    '44444444-0000-0000-0000-000000000004',
    '33333333-0000-0000-0000-000000000004',
    '11111111-0000-0000-0000-000000000006',
    'Soybean Basis Narrows as Export Demand Picks Up',
    'https://prairiepost.news/markets/soybean-basis-export-demand',
    'Basis at regional elevators improved 12 cents per bushel this week on stronger-than-expected export commitments.',
    NOW() - INTERVAL '1 day',
    'prairie-soybean-basis-2024-1202'
  ),
  (
    '44444444-0000-0000-0000-000000000005',
    '33333333-0000-0000-0000-000000000004',
    '11111111-0000-0000-0000-000000000006',
    'Cover Crop Cost-Share Program Opens for 2025 Sign-Up',
    'https://prairiepost.news/agriculture/cover-crop-cost-share-2025-signup',
    'FSA offices begin accepting applications for cover crop cost-share assistance under the Conservation Reserve Enhancement Program.',
    NOW() - INTERVAL '3 days',
    'prairie-cover-crop-signup-2024-1130'
  );


-- ============================================================
-- REPUBLICATION LOG
-- (which orgs have copied which stories)
-- ============================================================

INSERT INTO republication_log (id, story_id, republishing_org_id, republished_url, downloaded_at) VALUES
  -- Riverside Gazette republished Valley Tribune water bond story
  (
    '55555555-0000-0000-0000-000000000001',
    '22222222-0000-0000-0000-000000000001',
    '11111111-0000-0000-0000-000000000002',
    'https://riversidegazette.net/regional/valley-county-approves-water-bond',
    NOW() - INTERVAL '1 day'
  ),
  -- Mountain View Weekly republished Valley Tribune water bond story
  (
    '55555555-0000-0000-0000-000000000002',
    '22222222-0000-0000-0000-000000000001',
    '11111111-0000-0000-0000-000000000003',
    NULL,
    NOW() - INTERVAL '2 days'
  ),
  -- Prairie Post republished Coastal Current kelp story
  (
    '55555555-0000-0000-0000-000000000003',
    '22222222-0000-0000-0000-000000000009',
    '11111111-0000-0000-0000-000000000006',
    NULL,
    NOW() - INTERVAL '1 day'
  ),
  -- Valley Tribune republished Highpoint Herald teachers strike story
  (
    '55555555-0000-0000-0000-000000000004',
    '22222222-0000-0000-0000-000000000014',
    '11111111-0000-0000-0000-000000000001',
    NULL,
    NOW() - INTERVAL '8 hours'
  ),
  -- Riverside Gazette republished Riverside Hospital ER story (own story, for log completeness)
  (
    '55555555-0000-0000-0000-000000000005',
    '22222222-0000-0000-0000-000000000009',
    '11111111-0000-0000-0000-000000000005',
    'https://highpointherald.com/environment/kelp-forest-crisis-coast',
    NOW() - INTERVAL '18 hours'
  ),
  -- Mountain View republished Highpoint Herald homeless campus story
  (
    '55555555-0000-0000-0000-000000000006',
    '22222222-0000-0000-0000-000000000013',
    '11111111-0000-0000-0000-000000000003',
    NULL,
    NOW() - INTERVAL '6 hours'
  );


-- ============================================================
-- REPUBLICATION REQUESTS
-- ============================================================

INSERT INTO republication_requests (id, requesting_org_id, target_org_id, story_id, requested_headline, requested_url, message, status, decline_reason, created_at, updated_at) VALUES
  -- Valley Tribune asked Highpoint Herald for teachers strike story (fulfilled)
  (
    '66666666-0000-0000-0000-000000000001',
    '11111111-0000-0000-0000-000000000001',
    '11111111-0000-0000-0000-000000000005',
    '22222222-0000-0000-0000-000000000014',
    NULL,
    NULL,
    'We''d like to run this in our print edition this weekend. Our readers are following education labor issues closely.',
    'fulfilled',
    NULL,
    NOW() - INTERVAL '10 hours',
    NOW() - INTERVAL '8 hours'
  ),
  -- Mountain View asked Riverside Gazette for hospital ER story (pending)
  (
    '66666666-0000-0000-0000-000000000002',
    '11111111-0000-0000-0000-000000000003',
    '11111111-0000-0000-0000-000000000002',
    '22222222-0000-0000-0000-000000000004',
    NULL,
    NULL,
    'Our readers in the foothills use Riverside General. This is very relevant to our coverage area.',
    'pending',
    NULL,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
  ),
  -- Prairie Post asked Coastal Current for kelp story (fulfilled)
  (
    '66666666-0000-0000-0000-000000000003',
    '11111111-0000-0000-0000-000000000006',
    '11111111-0000-0000-0000-000000000004',
    '22222222-0000-0000-0000-000000000009',
    NULL,
    NULL,
    'The fisheries angle is directly relevant to our coverage of commodity markets and rural livelihoods.',
    'fulfilled',
    NULL,
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '1 day'
  ),
  -- Riverside Gazette asked Valley Tribune for enrollment story (declined)
  (
    '66666666-0000-0000-0000-000000000004',
    '11111111-0000-0000-0000-000000000002',
    '11111111-0000-0000-0000-000000000001',
    '22222222-0000-0000-0000-000000000002',
    NULL,
    NULL,
    'We are seeing the same trends in our district and would like to run your reporting with attribution.',
    'declined',
    'We have a follow-up investigation in progress on this story and need to hold exclusivity a bit longer. Happy to share in two weeks.',
    NOW() - INTERVAL '4 days',
    NOW() - INTERVAL '3 days'
  ),
  -- Coastal Current asked Prairie Post for grain bankruptcy story (pending)
  (
    '66666666-0000-0000-0000-000000000005',
    '11111111-0000-0000-0000-000000000004',
    '11111111-0000-0000-0000-000000000006',
    '22222222-0000-0000-0000-000000000017',
    NULL,
    NULL,
    'We cover commodity supply chains and our readers would find this grain cooperative story compelling.',
    'pending',
    NULL,
    NOW() - INTERVAL '6 days',
    NOW() - INTERVAL '6 days'
  ),
  -- Highpoint Herald general request (no specific story) to Valley Tribune
  (
    '66666666-0000-0000-0000-000000000006',
    '11111111-0000-0000-0000-000000000005',
    '11111111-0000-0000-0000-000000000001',
    NULL,
    'Tech Campus Announcement',
    NULL,
    'Do you have any coverage planned for the rumored tech company announcement? We''d love to coordinate or share reporting.',
    'pending',
    NULL,
    NOW() - INTERVAL '12 hours',
    NOW() - INTERVAL '12 hours'
  );
