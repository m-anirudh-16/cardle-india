import ambassadorImg from '../assets/images/car_hindustan_ambassador_1794758216492.jpg';
import maruti800Img from '../assets/images/car_maruti_800_1794758217271.jpg';
import gypsyImg from '../assets/images/car_maruti_gypsy_1794758217941.jpg';
import safariImg from '../assets/images/car_tata_safari_1794758220012.jpg';
import nanoImg from '../assets/images/car_tata_nano_1794758219846.jpg';
import cityImg from '../assets/images/car_honda_city_1794758220720.jpg';
import swiftImg from '../assets/images/car_maruti_swift_1794758221019.jpg';
import fortunerImg from '../assets/images/car_toyota_fortuner_1794758220881.jpg';
import seltosImg from '../assets/images/car_kia_seltos_1794758221644.jpg';
import tharImg from '../assets/images/car_mahindra_thar_1794758221317.jpg';
import cretaImg from '../assets/images/car_hyundai_creta_1794758221787.jpg';
import scorpioNImg from '../assets/images/car_mahindra_scorpio_n_1794758223544.jpg';
import nexonImg from '../assets/images/car_tata_nexon_1794758257338.jpg';
import poloImg from '../assets/images/car_volkswagen_polo_1794758258108.jpg';
import dusterImg from '../assets/images/car_renault_duster_1794758258294.jpg';
import i20Img from '../assets/images/car_hyundai_i20_1794758259343.jpg';
import ecosportImg from '../assets/images/car_ford_ecosport_1794758260869.jpg';
import jimnyImg from '../assets/images/car_maruti_jimny_1794758260364.jpg';
import indicaImg from '../assets/images/car_tata_indica_1794758717763.jpg';
import boleroImg from '../assets/images/car_mahindra_bolero_1794758718210.jpg';
import wagonrImg from '../assets/images/car_maruti_wagonr_1794758718194.jpg';
import altoImg from '../assets/images/car_maruti_alto_1794758719030.jpg';
import civicImg from '../assets/images/car_honda_civic_1794758719961.jpg';
import octaviaImg from '../assets/images/car_skoda_octavia_1794758720107.jpg';

export type CarEra = 'Classic' | '2000s' | 'Modern';

export interface PuzzleCar {
  id: string;
  make: string;
  model: string;
  year: number;
  generation: string;
  era: CarEra;
  bodyType: string;
  image: string;
  /** Focal X percentage (0-100) for extreme macro crop, avoiding badge giveaways */
  focalX: number;
  /** Focal Y percentage (0-100) for extreme macro crop */
  focalY: number;
  funFact: string;
}

export const PUZZLE_DECK: PuzzleCar[] = [
  {
    id: 'hindustan-ambassador-1979',
    make: 'Hindustan Motors',
    model: 'Ambassador',
    year: 1979,
    generation: 'Mark IV',
    era: 'Classic',
    bodyType: 'Sedan',
    image: ambassadorImg,
    focalX: 43,
    focalY: 50,
    funFact:
      'Built in Uttarpara from 1958 to 2014, the Ambassador became the unmistakable symbol of Indian officialdom and city taxis.',
  },
  {
    id: 'maruti-800-1988',
    make: 'Maruti Suzuki',
    model: '800',
    year: 1988,
    generation: 'SB308 (2nd Gen)',
    era: 'Classic',
    bodyType: 'Hatchback',
    image: maruti800Img,
    focalX: 63,
    focalY: 54,
    funFact:
      'Launched in December 1983, the Maruti 800 democratized private car ownership across India with over 2.7 million units sold.',
  },
  {
    id: 'maruti-gypsy-1996',
    make: 'Maruti Suzuki',
    model: 'Gypsy',
    year: 1996,
    generation: 'MG413W King',
    era: 'Classic',
    bodyType: 'Off-Road SUV',
    image: gypsyImg,
    focalX: 67,
    focalY: 44,
    funFact:
      'Loved by rally drivers and the Indian Armed Forces alike, the lightweight 4x4 Gypsy stayed in production for over three decades.',
  },
  {
    id: 'tata-indica-2004',
    make: 'Tata',
    model: 'Indica',
    year: 2004,
    generation: 'Indica V2',
    era: '2000s',
    bodyType: 'Hatchback',
    image: indicaImg,
    focalX: 34,
    focalY: 56,
    funFact:
      'Unveiled in 1998 as India’s first indigenously developed passenger hatchback, the Indica V2 became a staple for families and fleets.',
  },
  {
    id: 'tata-safari-2008',
    make: 'Tata',
    model: 'Safari',
    year: 2008,
    generation: 'Dicor 2.2 VTT',
    era: '2000s',
    bodyType: 'SUV',
    image: safariImg,
    focalX: 46,
    focalY: 38,
    funFact:
      'Introduced in 1998 as India’s first indigenously designed SUV, its stepped roof and tailgate-mounted spare became an icon.',
  },
  {
    id: 'maruti-alto-2008',
    make: 'Maruti Suzuki',
    model: 'Alto',
    year: 2008,
    generation: '1st Gen',
    era: '2000s',
    bodyType: 'Hatchback',
    image: altoImg,
    focalX: 34,
    focalY: 53,
    funFact:
      'For over 15 consecutive years, the Alto reigned as India’s best-selling car thanks to rock-solid reliability and low running costs.',
  },
  {
    id: 'honda-civic-2008',
    make: 'Honda',
    model: 'Civic',
    year: 2008,
    generation: '8th Gen (FD)',
    era: '2000s',
    bodyType: 'Sedan',
    image: civicImg,
    focalX: 78,
    focalY: 42,
    funFact:
      'Famous for its futuristic two-tier digital speedometer and high-revving 1.8L i-VTEC engine, the 8th-gen Civic remains a tuner favorite.',
  },
  {
    id: 'tata-nano-2012',
    make: 'Tata',
    model: 'Nano',
    year: 2012,
    generation: 'Gen 1 LX',
    era: '2000s',
    bodyType: 'Microcar',
    image: nanoImg,
    focalX: 29,
    focalY: 57,
    funFact:
      'Engineered with a rear-mounted 624cc twin-cylinder engine, the Nano offered surprising cabin space inside a 3.1-metre footprint.',
  },
  {
    id: 'maruti-wagonr-2013',
    make: 'Maruti Suzuki',
    model: 'WagonR',
    year: 2013,
    generation: '2nd Gen',
    era: '2000s',
    bodyType: 'Hatchback',
    image: wagonrImg,
    focalX: 82,
    focalY: 40,
    funFact:
      'The tall-boy WagonR packaging delivered unmatched headroom and easy ingress, selling over 3 million units across India.',
  },
  {
    id: 'maruti-swift-2014',
    make: 'Maruti Suzuki',
    model: 'Swift',
    year: 2014,
    generation: '2nd Gen',
    era: '2000s',
    bodyType: 'Hatchback',
    image: swiftImg,
    focalX: 51,
    focalY: 47,
    funFact:
      'The Swift broke Maruti’s boxy mold in 2005 with blacked-out A-pillars, a wrap-around windshield, and enthusiast-friendly handling.',
  },
  {
    id: 'renault-duster-2015',
    make: 'Renault',
    model: 'Duster',
    year: 2015,
    generation: '1st Gen AWD',
    era: '2000s',
    bodyType: 'SUV',
    image: dusterImg,
    focalX: 43,
    focalY: 54,
    funFact:
      'The Renault Duster sparked India’s monocoque compact SUV boom in 2012 with its famously plush suspension setup.',
  },
  {
    id: 'honda-city-2016',
    make: 'Honda',
    model: 'City',
    year: 2016,
    generation: '4th Gen Facelift',
    era: 'Modern',
    bodyType: 'Sedan',
    image: cityImg,
    focalX: 59,
    focalY: 57,
    funFact:
      'Debuting in India in 1998, the Honda City has defined the mid-size executive sedan segment across five generations.',
  },
  {
    id: 'volkswagen-polo-2016',
    make: 'Volkswagen',
    model: 'Polo',
    year: 2016,
    generation: 'GT TSI (Mk5)',
    era: 'Modern',
    bodyType: 'Hatchback',
    image: poloImg,
    focalX: 46,
    focalY: 53,
    funFact:
      'Sold in India from 2010 to 2022, the Polo GT TSI’s 7-speed DSG gearbox earned a cult following among Indian enthusiasts.',
  },
  {
    id: 'mahindra-bolero-2018',
    make: 'Mahindra',
    model: 'Bolero',
    year: 2018,
    generation: 'Power+',
    era: 'Modern',
    bodyType: 'SUV',
    image: boleroImg,
    focalX: 34,
    focalY: 55,
    funFact:
      'With exposed door hinges, leaf-spring toughness, and a go-anywhere diesel engine, the Bolero has ruled rural and semi-urban India since 2000.',
  },
  {
    id: 'hyundai-i20-2018',
    make: 'Hyundai',
    model: 'i20',
    year: 2018,
    generation: 'Elite i20 Facelift',
    era: 'Modern',
    bodyType: 'Hatchback',
    image: i20Img,
    focalX: 74,
    focalY: 40,
    funFact:
      'Designed with Fluidic Sculpture 2.0 styling and a gloss-black C-pillar, the Elite i20 set the premium hatchback standard in 2014.',
  },
  {
    id: 'skoda-octavia-2018',
    make: 'Skoda',
    model: 'Octavia',
    year: 2018,
    generation: '3rd Gen Facelift',
    era: 'Modern',
    bodyType: 'Sedan',
    image: octaviaImg,
    focalX: 37,
    focalY: 54,
    funFact:
      'Launched in India in 2001, the Octavia introduced turbo-diesel performance and liftback practicality to Indian sedan buyers.',
  },
  {
    id: 'ford-ecosport-2019',
    make: 'Ford',
    model: 'EcoSport',
    year: 2019,
    generation: 'Facelift Titanium',
    era: 'Modern',
    bodyType: 'Compact SUV',
    image: ecosportImg,
    focalX: 45,
    focalY: 51,
    funFact:
      'Launched in 2013 under the 4-metre tax rule, the EcoSport pioneered the sub-compact SUV category in India.',
  },
  {
    id: 'kia-seltos-2020',
    make: 'Kia',
    model: 'Seltos',
    year: 2020,
    generation: '1st Gen GT Line',
    era: 'Modern',
    bodyType: 'SUV',
    image: seltosImg,
    focalX: 43,
    focalY: 48,
    funFact:
      'The Seltos launched Kia’s Indian innings in 2019 from its Anantapur plant, instantly becoming a segment benchmark.',
  },
  {
    id: 'toyota-fortuner-2021',
    make: 'Toyota',
    model: 'Fortuner',
    year: 2021,
    generation: '2nd Gen Facelift',
    era: 'Modern',
    bodyType: 'Full-Size SUV',
    image: fortunerImg,
    focalX: 46,
    focalY: 49,
    funFact:
      'Built on Toyota’s tough IMV ladder-frame platform, the Fortuner has dominated India’s full-size 7-seater SUV segment since 2009.',
  },
  {
    id: 'hyundai-creta-2021',
    make: 'Hyundai',
    model: 'Creta',
    year: 2021,
    generation: '2nd Gen',
    era: 'Modern',
    bodyType: 'SUV',
    image: cretaImg,
    focalX: 42,
    focalY: 54,
    funFact:
      'Since 2015, the Creta has consistently topped India’s compact SUV charts with over a million units sold.',
  },
  {
    id: 'mahindra-thar-2022',
    make: 'Mahindra',
    model: 'Thar',
    year: 2022,
    generation: '2nd Gen (3-Door)',
    era: 'Modern',
    bodyType: 'Off-Road SUV',
    image: tharImg,
    focalX: 31,
    focalY: 56,
    funFact:
      'Redesigned from the ground up in 2020, the second-gen Thar paired classic 4x4 capability with a factory hardtop and 4-star GNCAP rating.',
  },
  {
    id: 'tata-nexon-2022',
    make: 'Tata',
    model: 'Nexon',
    year: 2022,
    generation: '1st Gen Facelift',
    era: 'Modern',
    bodyType: 'Compact SUV',
    image: nexonImg,
    focalX: 44,
    focalY: 48,
    funFact:
      'In 2018, the Tata Nexon became the first made-in-India car to earn a full 5-star Global NCAP adult safety rating.',
  },
  {
    id: 'mahindra-scorpio-n-2023',
    make: 'Mahindra',
    model: 'Scorpio-N',
    year: 2023,
    generation: 'Z101',
    era: 'Modern',
    bodyType: 'SUV',
    image: scorpioNImg,
    focalX: 35,
    focalY: 46,
    funFact:
      'Its signature chrome scorpion-tail kink along the rear window pays homage to the original 2002 Scorpio lineage.',
  },
  {
    id: 'maruti-jimny-2024',
    make: 'Maruti Suzuki',
    model: 'Jimny',
    year: 2024,
    generation: '5-Door Alpha AllGrip',
    era: 'Modern',
    bodyType: 'Off-Road SUV',
    image: jimnyImg,
    focalX: 73,
    focalY: 44,
    funFact:
      'India was the global debut market and manufacturing hub for the 5-door Suzuki Jimny in 2023.',
  },
];

const DAILY_EPOCH_UTC = Date.UTC(2026, 10, 15); // 2026-11-15 launch day = Puzzle #1

export function getTodayDateKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getPuzzleNumber(dateKey: string): number {
  const [y, m, d] = dateKey.split('-').map(Number);
  const currentUtc = Date.UTC(y, m - 1, d);
  const diffDays = Math.floor((currentUtc - DAILY_EPOCH_UTC) / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays + 1);
}

export function getDailyPuzzle(dateKey: string): PuzzleCar {
  const puzzleNum = getPuzzleNumber(dateKey);
  // 7 is coprime to 24, ensuring every car appears before repeating
  const index = ((puzzleNum - 1) * 7 + 3) % PUZZLE_DECK.length;
  return PUZZLE_DECK[index];
}
