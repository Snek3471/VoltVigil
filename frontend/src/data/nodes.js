/**
 * 12 simulated sensor node locations distributed across a power grid region.
 * Each node has an initial severity state.
 */
const SEVERITIES = ['low', 'medium', 'high', 'critical'];

const NODES = [
  { id: 'NODE-001', lat: 40.7128,  lng: -74.0060,  severity: 'low'      },
  { id: 'NODE-002', lat: 40.7282,  lng: -73.7949,  severity: 'medium'   },
  { id: 'NODE-003', lat: 40.6501,  lng: -73.9496,  severity: 'low'      },
  { id: 'NODE-004', lat: 40.7580,  lng: -73.8855,  severity: 'high'     },
  { id: 'NODE-005', lat: 40.6892,  lng: -74.1745,  severity: 'low'      },
  { id: 'NODE-006', lat: 40.8448,  lng: -73.8648,  severity: 'critical' },
  { id: 'NODE-007', lat: 40.7306,  lng: -73.9352,  severity: 'medium'   },
  { id: 'NODE-008', lat: 40.6782,  lng: -73.9442,  severity: 'low'      },
  { id: 'NODE-009', lat: 40.7023,  lng: -74.0131,  severity: 'medium'   },
  { id: 'NODE-010', lat: 40.7439,  lng: -74.0324,  severity: 'low'      },
  { id: 'NODE-011', lat: 40.7831,  lng: -73.9712,  severity: 'high'     },
  { id: 'NODE-012', lat: 40.7143,  lng: -74.0059,  severity: 'low'      },
];

export { NODES, SEVERITIES };
