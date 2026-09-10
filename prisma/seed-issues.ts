/**
 * The sample issues shown in the demo.
 *
 * Every issue carries a full timeline rather than just a current status,
 * because a timeline with one row proves nothing. These are written to look
 * like a fortnight of real activity in a London borough: some reports still
 * waiting, some being worked on, some fixed, one rejected with a reason, and
 * one reopened because the fix did not hold.
 *
 * Ids are explicit and prefixed `seed-` so the script is idempotent and so demo
 * rows are obvious in the database.
 */

/** Who performed a step. Resolved to a real user id when the seed runs. */
export type Actor = "citizen" | "admin";

export type TimelineStep = {
  status: "SUBMITTED" | "ACKNOWLEDGED" | "IN_PROGRESS" | "RESOLVED" | "REJECTED" | "REOPENED";
  /** Days after the issue was first reported. */
  afterDays: number;
  actor: Actor;
  reason: string;
};

export type SeedIssue = {
  id: string;
  title: string;
  description: string;
  categorySlug: string;
  addressLabel: string;
  latitude: number;
  longitude: number;
  /** How long ago the first report was filed. */
  reportedDaysAgo: number;
  timeline: TimelineStep[];
};

const REPORTED = "Reported by a resident.";

export const SEED_ISSUES: SeedIssue[] = [
  {
    id: "seed-issue-01",
    title: "Deep pothole outside the library",
    description:
      "There is a pothole roughly half a metre across on the northbound side, right where cyclists pull in. It has been getting worse since the cold snap and a cyclist came off in it last week.",
    categorySlug: "roads",
    addressLabel: "Camberwell Road, near the library",
    latitude: 51.474,
    longitude: -0.093,
    reportedDaysAgo: 21,
    timeline: [
      { status: "SUBMITTED", afterDays: 0, actor: "citizen", reason: REPORTED },
      {
        status: "ACKNOWLEDGED",
        afterDays: 2,
        actor: "admin",
        reason: "Inspected and confirmed. Logged with the highways team as a category 1 defect.",
      },
      {
        status: "IN_PROGRESS",
        afterDays: 6,
        actor: "admin",
        reason: "Resurfacing crew scheduled for Thursday.",
      },
      {
        status: "RESOLVED",
        afterDays: 9,
        actor: "admin",
        reason: "Permanent repair completed and the surface re-levelled.",
      },
    ],
  },
  {
    id: "seed-issue-02",
    title: "Street light out for three weeks",
    description:
      "The light outside number 44 has been dark since the start of the month. The stretch between the bus stop and the corner is now completely unlit and it feels unsafe walking home.",
    categorySlug: "streetlight",
    addressLabel: "Brixton Hill, outside number 44",
    latitude: 51.456,
    longitude: -0.117,
    reportedDaysAgo: 12,
    timeline: [
      { status: "SUBMITTED", afterDays: 0, actor: "citizen", reason: REPORTED },
      {
        status: "ACKNOWLEDGED",
        afterDays: 1,
        actor: "admin",
        reason: "Fault confirmed. Passed to the lighting contractor.",
      },
      {
        status: "IN_PROGRESS",
        afterDays: 4,
        actor: "admin",
        reason:
          "Contractor attended; the column needs a replacement control gear unit, which is on order.",
      },
    ],
  },
  {
    id: "seed-issue-03",
    title: "Fly-tipping behind the parade of shops",
    description:
      "Someone has dumped a sofa, two mattresses and several bags of building waste in the service alley. It has been there over a week and is starting to attract rats.",
    categorySlug: "waste",
    addressLabel: "Service alley off Hackney Road",
    latitude: 51.529,
    longitude: -0.07,
    reportedDaysAgo: 9,
    timeline: [
      { status: "SUBMITTED", afterDays: 0, actor: "citizen", reason: REPORTED },
      {
        status: "ACKNOWLEDGED",
        afterDays: 1,
        actor: "admin",
        reason: "Confirmed. Booked for a bulky waste collection.",
      },
      {
        status: "RESOLVED",
        afterDays: 3,
        actor: "admin",
        reason: "All items removed and the alley swept.",
      },
      {
        status: "REOPENED",
        afterDays: 7,
        actor: "citizen",
        reason:
          "More waste has been dumped in exactly the same spot. The original clearance was done, but the location clearly needs a barrier or a camera.",
      },
      {
        status: "IN_PROGRESS",
        afterDays: 8,
        actor: "admin",
        reason: "Second clearance booked and referred to enforcement for a site assessment.",
      },
    ],
  },
  {
    id: "seed-issue-04",
    title: "Paving slabs lifted by tree roots",
    description:
      "Three slabs outside the chemist have been pushed up by a good five centimetres. My neighbour uses a walking frame and cannot get past without stepping into the road.",
    categorySlug: "pavement",
    addressLabel: "Holloway Road, outside the chemist",
    latitude: 51.553,
    longitude: -0.115,
    reportedDaysAgo: 16,
    timeline: [
      { status: "SUBMITTED", afterDays: 0, actor: "citizen", reason: REPORTED },
      {
        status: "ACKNOWLEDGED",
        afterDays: 3,
        actor: "admin",
        reason:
          "Inspected. Trip hazard confirmed at 52mm, which is above our intervention threshold.",
      },
      {
        status: "IN_PROGRESS",
        afterDays: 5,
        actor: "admin",
        reason:
          "Temporary ramp applied while a root-friendly relay is scheduled with the tree officer.",
      },
    ],
  },
  {
    id: "seed-issue-05",
    title: "Graffiti tags along the railway wall",
    description:
      "A long run of tagging has appeared along the wall by the bridge, maybe thirty metres of it. Not offensive, just very visible on the walk to the station.",
    categorySlug: "graffiti",
    addressLabel: "Camden High Street, railway bridge",
    latitude: 51.539,
    longitude: -0.143,
    reportedDaysAgo: 5,
    timeline: [
      { status: "SUBMITTED", afterDays: 0, actor: "citizen", reason: REPORTED },
      {
        status: "ACKNOWLEDGED",
        afterDays: 2,
        actor: "admin",
        reason:
          "Confirmed. The wall belongs to the rail operator, so we have raised it with them and will chase.",
      },
    ],
  },
  {
    id: "seed-issue-06",
    title: "Blocked drain flooding the crossing",
    description:
      "Every time it rains the gully by the crossing backs up and the whole corner floods ankle-deep. Buses going past soak anyone waiting to cross.",
    categorySlug: "drainage",
    addressLabel: "Whitechapel Road, by the pedestrian crossing",
    latitude: 51.519,
    longitude: -0.06,
    reportedDaysAgo: 14,
    timeline: [
      { status: "SUBMITTED", afterDays: 0, actor: "citizen", reason: REPORTED },
      {
        status: "ACKNOWLEDGED",
        afterDays: 1,
        actor: "admin",
        reason: "Confirmed against two other reports at the same junction.",
      },
      {
        status: "IN_PROGRESS",
        afterDays: 2,
        actor: "admin",
        reason:
          "Jetting crew attended; the blockage is further down the connection than expected and needs a camera survey.",
      },
      {
        status: "RESOLVED",
        afterDays: 11,
        actor: "admin",
        reason:
          "Survey found root ingress. The section has been relined and the gully now clears in under a minute.",
      },
    ],
  },
  {
    id: "seed-issue-07",
    title: "Broken glass across the playground",
    description:
      "Someone has smashed bottles across the toddler play area overnight. There is glass in the bark chippings under the climbing frame.",
    categorySlug: "parks",
    addressLabel: "Peckham Rye, children's playground",
    latitude: 51.461,
    longitude: -0.068,
    reportedDaysAgo: 4,
    timeline: [
      { status: "SUBMITTED", afterDays: 0, actor: "citizen", reason: REPORTED },
      {
        status: "ACKNOWLEDGED",
        afterDays: 0.2,
        actor: "admin",
        reason: "Treated as urgent given the location. Park keeper dispatched the same morning.",
      },
      {
        status: "RESOLVED",
        afterDays: 1,
        actor: "admin",
        reason: "Area cleared, chippings raked and screened, and the bins emptied.",
      },
    ],
  },
  {
    id: "seed-issue-08",
    title: "Road surface breaking up at the junction",
    description:
      "The whole approach to the junction is crazed and crumbling. Bits of loose tarmac are being flicked up by passing traffic.",
    categorySlug: "roads",
    addressLabel: "Kilburn High Road, at the junction",
    latitude: 51.546,
    longitude: -0.195,
    reportedDaysAgo: 25,
    timeline: [
      { status: "SUBMITTED", afterDays: 0, actor: "citizen", reason: REPORTED },
      {
        status: "ACKNOWLEDGED",
        afterDays: 4,
        actor: "admin",
        reason: "Inspected. Deterioration confirmed across roughly 40 square metres.",
      },
    ],
  },
  {
    id: "seed-issue-09",
    title: "Bins not collected on the high street",
    description:
      "The public bins outside the market have been overflowing since the weekend and there is litter blowing down the street.",
    categorySlug: "waste",
    addressLabel: "Deptford High Street, by the market",
    latitude: 51.478,
    longitude: -0.026,
    reportedDaysAgo: 3,
    timeline: [
      { status: "SUBMITTED", afterDays: 0, actor: "citizen", reason: REPORTED },
      {
        status: "IN_PROGRESS",
        afterDays: 1,
        actor: "admin",
        reason: "Missed collection confirmed. Added to today's round.",
      },
    ],
  },
  {
    id: "seed-issue-10",
    title: "Light flickering all night",
    description:
      "The lamp opposite the park gate flickers constantly from dusk until morning. It is not out, but it strobes and it is genuinely unpleasant to walk under.",
    categorySlug: "streetlight",
    addressLabel: "Green Lanes, opposite the park gate",
    latitude: 51.582,
    longitude: -0.098,
    reportedDaysAgo: 8,
    timeline: [
      { status: "SUBMITTED", afterDays: 0, actor: "citizen", reason: REPORTED },
      {
        status: "ACKNOWLEDGED",
        afterDays: 2,
        actor: "admin",
        reason: "Confirmed on a night inspection. A failing lamp rather than a full outage.",
      },
      {
        status: "RESOLVED",
        afterDays: 5,
        actor: "admin",
        reason: "Lamp and photocell replaced.",
      },
    ],
  },
  {
    id: "seed-issue-11",
    title: "Pavement blocked by an overgrown hedge",
    description:
      "A hedge from one of the front gardens has grown right across the footway. Pushchairs and wheelchairs have to go into the road to get past.",
    categorySlug: "pavement",
    addressLabel: "Walworth Road, near the surgery",
    latitude: 51.487,
    longitude: -0.096,
    reportedDaysAgo: 11,
    timeline: [
      { status: "SUBMITTED", afterDays: 0, actor: "citizen", reason: REPORTED },
      {
        status: "ACKNOWLEDGED",
        afterDays: 3,
        actor: "admin",
        reason:
          "Obstruction confirmed. This is private planting, so the owner gets 14 days notice before we cut it back.",
      },
    ],
  },
  {
    id: "seed-issue-12",
    title: "Offensive graffiti on the shop shutters",
    description:
      "Racist graffiti has been sprayed on the shutters of the corner shop. The owner is understandably upset and would like it gone before he opens.",
    categorySlug: "graffiti",
    addressLabel: "Bethnal Green Road, corner shop",
    latitude: 51.525,
    longitude: -0.064,
    reportedDaysAgo: 6,
    timeline: [
      { status: "SUBMITTED", afterDays: 0, actor: "citizen", reason: REPORTED },
      {
        status: "ACKNOWLEDGED",
        afterDays: 0.1,
        actor: "admin",
        reason:
          "Escalated immediately. Offensive graffiti is a same-day removal under our policy.",
      },
      {
        status: "RESOLVED",
        afterDays: 0.2,
        actor: "admin",
        reason: "Removed within four hours and reported to the police as a hate incident.",
      },
    ],
  },
  {
    id: "seed-issue-13",
    title: "Fallen branch blocking the path",
    description:
      "A large branch came down in the wind and is lying across the main path through the common. People are walking around it over the grass, which is churning up.",
    categorySlug: "parks",
    addressLabel: "Clapham Common, main path",
    latitude: 51.457,
    longitude: -0.14,
    reportedDaysAgo: 2,
    timeline: [
      { status: "SUBMITTED", afterDays: 0, actor: "citizen", reason: REPORTED },
      {
        status: "ACKNOWLEDGED",
        afterDays: 1,
        actor: "admin",
        reason: "Confirmed. Tree team booked for tomorrow morning.",
      },
    ],
  },
  {
    id: "seed-issue-14",
    title: "Car parked across the dropped kerb",
    description:
      "A car is parked half on the pavement outside the flats most evenings and blocks the dropped kerb entirely.",
    categorySlug: "other",
    addressLabel: "Uxbridge Road, outside the flats",
    latitude: 51.512,
    longitude: -0.305,
    reportedDaysAgo: 10,
    timeline: [
      { status: "SUBMITTED", afterDays: 0, actor: "citizen", reason: REPORTED },
      {
        status: "REJECTED",
        afterDays: 2,
        actor: "admin",
        reason:
          "Closing this here because parking enforcement is handled by a different team and cannot be actioned through this service. It has been reported directly to civil enforcement on your behalf, reference CE-4471, and they will attend on an evening patrol. Nothing further will happen on this record.",
      },
    ],
  },
  {
    id: "seed-issue-15",
    title: "Standing water outside the school gates",
    description:
      "There is a permanent puddle across the whole width of the pavement at the school entrance. Children are walking in the road to avoid it at drop-off time.",
    categorySlug: "drainage",
    addressLabel: "Roman Road, at the school entrance",
    latitude: 51.531,
    longitude: -0.035,
    reportedDaysAgo: 19,
    timeline: [
      { status: "SUBMITTED", afterDays: 0, actor: "citizen", reason: REPORTED },
      {
        status: "ACKNOWLEDGED",
        afterDays: 5,
        actor: "admin",
        reason: "Inspected at drop-off time and the problem is as described.",
      },
      {
        status: "IN_PROGRESS",
        afterDays: 9,
        actor: "admin",
        reason:
          "Gully cleared but the water is still standing, so the footway levels need adjusting. Works order raised.",
      },
    ],
  },
];
