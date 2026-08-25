// ===========================================================================
// K9 CAMP DATA — this is the only file staff need to edit.
//
// Every activity is one line. Fields:
//
//   time      "HH:MM" in 24hr. Required. Items are sorted by this.
//   title     What shows in bold. Required.
//   location  Where to report. Shows as "📍 ...". Leave "" to hide.
//   uniform   Overrides the uniform for this item only. Leave out to use
//             the day's uniform. One of: Greens, Blues, Civvies, Sports.
//   end       Optional finish time, "HH:MM". Shown under the start time.
//   note      Small print underneath. Leave "" to hide.
//   type      "meal" or "lightsout" for special styling. Leave out otherwise.
//
// To add an activity: copy any line, change the fields, done.
// To change lunch time: edit the time on that day's Lunch line.
// To add a day: add a new date block. It appears in My Week automatically.
// ===========================================================================

const data = {

  camp: {
    location: "RAF Leeming",

    // How far ahead cadets can see in My Week. Days after this are held back,
    // so nobody reads a plan that has not been confirmed yet.
    //
    //   "today"    only today, and nothing further        <- normal
    //   "24 Aug"   up to and including that date          <- release a day
    //   "all"      the whole week
    //
    // To release tomorrow, set this to tomorrow's date and push. Staff with
    // ?staff=true always see the full week regardless.
    showUpTo: "today"
  },

  programme: {

    "22 Aug": {
      uniform: "Civvies",
      items: [
        { time: "13:30", title: "Arrival & check-in", location: "", note: "Packed lunch paperwork • tent allocation" },
        { time: "15:30", title: "Camp Brief & Fire Drill", location: "", note: "" },
        { time: "17:00", title: "Dinner", location: "Dining Facility", note: "", type: "meal" },
        { time: "18:00", title: "Flight Brief", location: "", note: "Then down time and esports" },
        { time: "20:30", title: "Free Time", location: "", note: "" },
        { time: "22:00", title: "Lights Out", location: "", note: "", type: "lightsout" }
      ]
    },

    "23 Aug": {
      uniform: "Civvies",
      items: [
        { time: "07:00", title: "Breakfast", location: "Dining Facility", note: "", type: "meal" },
        { time: "12:00", title: "Lunch", location: "Dining Facility", note: "", type: "meal" },
        { time: "17:00", title: "Dinner", location: "Dining Facility", note: "", type: "meal" },
        { time: "18:00", title: "Evening Activity", location: "", note: "TBC" },
        { time: "20:30", title: "Free Time", location: "", note: "" },
        { time: "22:00", title: "Lights Out", location: "", note: "", type: "lightsout" }
      ],
      // AM: A & B on Leadership, C & D on First Aid, both halves.
      // PM: A & B swap between First Aid and AGS; C & D on Leadership throughout.
      flights: {
        A: [
          { time: "08:00", title: "Leadership", location: "", uniform: "Civvies", note: "" },
          { time: "10:00", title: "Leadership", location: "", uniform: "Civvies", note: "" },
          { time: "13:00", title: "First Aid", location: "", uniform: "Civvies", note: "" },
          { time: "15:00", title: "AGS", location: "", uniform: "Civvies", note: "" }
        ],
        B: [
          { time: "08:00", title: "Leadership", location: "", uniform: "Civvies", note: "" },
          { time: "10:00", title: "Leadership", location: "", uniform: "Civvies", note: "" },
          { time: "13:00", title: "AGS", location: "", uniform: "Civvies", note: "" },
          { time: "15:00", title: "First Aid", location: "", uniform: "Civvies", note: "" }
        ],
        C: [
          { time: "08:00", title: "First Aid", location: "", uniform: "Civvies", note: "" },
          { time: "10:00", title: "First Aid", location: "", uniform: "Civvies", note: "" },
          { time: "13:00", title: "Leadership", location: "", uniform: "Civvies", note: "" },
          { time: "15:00", title: "Leadership", location: "", uniform: "Civvies", note: "" }
        ],
        D: [
          { time: "08:00", title: "First Aid", location: "", uniform: "Civvies", note: "" },
          { time: "10:00", title: "First Aid", location: "", uniform: "Civvies", note: "" },
          { time: "13:00", title: "Leadership", location: "", uniform: "Civvies", note: "" },
          { time: "15:00", title: "Leadership", location: "", uniform: "Civvies", note: "" }
        ]
      }
    },

    "24 Aug": {
      uniform: "Greens",

      // Flight A is at AEF all day, so only B, C and D are on the stands.
      // The Flight A cadets who are not flying join another flight for the
      // day: their own flight is empty, so without this they would see
      // nothing. The roster is untouched; this is for this date only.
      flightMoves: { "003": "D", "010": "D", "012": "B", "004": "C", "008": "C", "015": "C", "002": "B" },

      // Everyone gets these...
      items: [
        { time: "07:00", title: "Breakfast", location: "Dining Facility", note: "", type: "meal" },
        { time: "13:00", end: "14:00", title: "Lunch", location: "Dining Facility", note: "", type: "meal" },
        { time: "17:00", title: "Dinner", location: "Dining Facility", note: "", type: "meal" },
        { time: "18:00", title: "Down Time and Esports", location: "", uniform: "Civvies", note: "Flight Sim also running, possible Cinebowl" },
        { time: "20:30", title: "Free Time", location: "", uniform: "Civvies", note: "" },
        { time: "22:00", title: "Lights Out", location: "", note: "", type: "lightsout" }
      ],

      // ...plus their own flight's rotation, merged in and sorted by time.
      //
      // Three activities of two hours: two before lunch, one after, then Drill
      // for all three flights together. B, C and D each do all three and no
      // two are ever on the same one. Flight A is flying and has no rotation.
      flights: {
        A: [],
        B: [
          { time: "09:00", end: "11:00", title: "Bridge Building", location: "Tented camp site", note: "" },
          { time: "11:00", end: "13:00", title: "Archery", location: "Tented camp site", note: "" },
          { time: "14:00", end: "16:00", title: "Paintball", location: "Tented camp site", note: "" },
          { time: "16:00", end: "17:00", title: "Drill", location: "Tented camp site", note: "All flights together" }
        ],
        C: [
          { time: "09:00", end: "11:00", title: "Archery", location: "Tented camp site", note: "" },
          { time: "11:00", end: "13:00", title: "Paintball", location: "Tented camp site", note: "" },
          { time: "14:00", end: "16:00", title: "Bridge Building", location: "Tented camp site", note: "" },
          { time: "16:00", end: "17:00", title: "Drill", location: "Tented camp site", note: "All flights together" }
        ],
        D: [
          { time: "09:00", end: "11:00", title: "Paintball", location: "Tented camp site", note: "" },
          { time: "11:00", end: "13:00", title: "Bridge Building", location: "Tented camp site", note: "" },
          { time: "14:00", end: "16:00", title: "Archery", location: "Tented camp site", note: "" },
          { time: "16:00", end: "17:00", title: "Drill", location: "Tented camp site", note: "All flights together" }
        ]
      }
    },

    // Taken from the camp admin order, Camp Four serials 61-80.
    "25 Aug": {
      uniform: "Greens",
      items: [
        { time: "07:00", end: "08:00", title: "Breakfast", location: "Dining Facility", note: "", type: "meal" },
        { time: "11:30", end: "13:30", title: "Packed Lunch", location: "RAFAC HQ", note: "Collect from Catering Flt", type: "meal" },
        { time: "17:30", end: "18:30", title: "Dinner", location: "Dining Facility", note: "", type: "meal" },
        { time: "18:00", end: "20:30", title: "RAFAC Activities", location: "RAFAC HQ", uniform: "Civvies", note: "" },
        { time: "22:00", title: "Lights Out", location: "", note: "", type: "lightsout" }
      ],
      // Four section visits. Each flight does four distinct stands and no two
      // flights are ever at the same one at the same time.
      //
      // From the admin order, serials 62-78, with one change on top: ATC is one
      // hour rather than the full period, including B at 1030-1130.
      //
      // Most stands run the full 0830-1000, 1000-1130, 1330-1500 and 1500-1630.
      // Fire Section and ATC are one hour, sitting at the end of their period
      // (0900-1000, 1030-1130, 1400-1500, 1530-1630), so the half hour before is
      // free for transfer and every flight still finishes together.
      flights: {
        A: [
          { time: "08:30", end: "10:00", title: "Section Visit", location: "90SU", note: "" },
          { time: "10:00", end: "11:30", title: "Section Visit", location: "34 Sqn", note: "" },
          { time: "13:30", end: "15:00", title: "Section Visit", location: "11 Sqn", note: "" },
          { time: "15:30", end: "16:30", title: "Section Visit", location: "Fire Section", note: "One hour only, the time before is for transfer" }
        ],
        B: [
          { time: "08:30", end: "10:00", title: "Section Visit", location: "34 Sqn", note: "" },
          { time: "10:30", end: "11:30", title: "Section Visit", location: "ATC", note: "One hour only, the time before is for transfer" },
          { time: "14:00", end: "15:00", title: "Section Visit", location: "Fire Section", note: "One hour only, the time before is for transfer" },
          { time: "15:00", end: "16:30", title: "Section Visit", location: "11 Sqn", note: "" }
        ],
        C: [
          { time: "08:30", end: "10:00", title: "Section Visit", location: "11 Sqn", note: "" },
          { time: "10:30", end: "11:30", title: "Section Visit", location: "Fire Section", note: "One hour only, the time before is for transfer" },
          { time: "13:30", end: "15:00", title: "Section Visit", location: "34 Sqn", note: "" },
          { time: "15:30", end: "16:30", title: "Section Visit", location: "ATC", note: "One hour only, the time before is for transfer" }
        ],
        D: [
          { time: "09:00", end: "10:00", title: "Section Visit", location: "Fire Section", note: "One hour only, the time before is for transfer" },
          { time: "10:00", end: "11:30", title: "Section Visit", location: "11 Sqn", note: "" },
          { time: "14:00", end: "15:00", title: "Section Visit", location: "ATC", note: "One hour only, the time before is for transfer" },
          { time: "15:00", end: "16:30", title: "Section Visit", location: "34 Sqn", note: "" }
        ]
      }
    },

    // A and B to York, C and D to Adventure Training. They swap on the 27th.
    "26 Aug": {
      uniform: "Civvies",
      items: [
        { time: "07:00", title: "Breakfast", location: "Dining Facility", note: "", type: "meal" },
        { time: "08:00", title: "Travel", location: "", note: "On foot / minibus / TBC" },
        { time: "12:00", title: "Lunch", location: "Dining Facility", note: "", type: "meal" },
        { time: "17:30", end: "18:30", title: "Dinner", location: "Dining Facility", note: "", type: "meal" },
        { time: "18:00", title: "RAF Presentation", location: "", note: "" },
        { time: "22:00", title: "Lights Out", location: "", note: "", type: "lightsout" }
      ],
      flights: {
        A: [
          { time: "09:00", title: "York Air Museum", location: "Elvington", note: "" },
          { time: "13:00", title: "York Air Museum", location: "Elvington", note: "" }
        ],
        B: [
          { time: "09:00", title: "York Air Museum", location: "Elvington", note: "" },
          { time: "13:00", title: "York Air Museum", location: "Elvington", note: "" }
        ],
        C: [
          { time: "09:00", title: "Adventure Training", location: "Adrenaline", uniform: "Sports", note: "Travel in civvies and change at the centre" },
          { time: "13:00", title: "Adventure Training", location: "Adrenaline", uniform: "Sports", note: "" }
        ],
        D: [
          { time: "09:00", title: "Adventure Training", location: "Adrenaline", uniform: "Sports", note: "Travel in civvies and change at the centre" },
          { time: "13:00", title: "Adventure Training", location: "Adrenaline", uniform: "Sports", note: "" }
        ]
      }
    },

    // The swap. Two coaches again: A and B to Adrenaline for Adventure
    // Training, C and D to York Air Museum, opposite to the 26th. Anyone with
    // an AEF slot flies instead and picks the activity up when they are back.
    "27 Aug": {
      uniform: "Civvies",
      items: [
        { time: "07:00", title: "Breakfast", location: "Dining Facility", note: "", type: "meal" },
        { time: "08:00", title: "Travel", location: "", note: "Coach" },
        { time: "12:00", title: "Lunch", location: "Dining Facility", note: "", type: "meal" },
        { time: "17:30", end: "18:30", title: "Dinner", location: "Dining Facility", note: "", type: "meal" },
        { time: "18:00", title: "Disco", location: "", note: "" },
        { time: "22:00", title: "Lights Out", location: "", note: "", type: "lightsout" }
      ],
      flights: {
        A: [
          { time: "09:00", title: "Adventure Training", location: "Adrenaline", uniform: "Sports", note: "Travel in civvies and change at the centre. Unless you have a flying slot today" },
          { time: "13:00", title: "Adventure Training", location: "Adrenaline", uniform: "Sports", note: "" }
        ],
        B: [
          { time: "09:00", title: "Adventure Training", location: "Adrenaline", uniform: "Sports", note: "Travel in civvies and change at the centre. Unless you have a flying slot today" },
          { time: "13:00", title: "Adventure Training", location: "Adrenaline", uniform: "Sports", note: "" }
        ],
        C: [
          { time: "09:00", title: "York Air Museum", location: "Elvington", note: "If you flew on Wednesday you are at Adrenaline today instead. Unless you have a flying slot" },
          { time: "13:00", title: "York Air Museum", location: "Elvington", note: "" }
        ],
        D: [
          { time: "09:00", title: "York Air Museum", location: "Elvington", note: "If you flew on Wednesday you are at Adrenaline today instead. Unless you have a flying slot" },
          { time: "13:00", title: "York Air Museum", location: "Elvington", note: "" }
        ]
      }
    },

    "28 Aug": {
      uniform: "Civvies",
      items: [
        { time: "07:00", title: "Breakfast", location: "Dining Facility", note: "", type: "meal" },
        { time: "08:00", title: "Fireside Chat", location: "", uniform: "Greens", note: "" },
        { time: "08:30", title: "Camp Photo", location: "", uniform: "Greens", note: "" },
        { time: "09:00", title: "Parade", location: "", uniform: "Greens", note: "" },
        { time: "09:30", title: "Camp Admin", location: "", note: "Clean up and pack" },
        { time: "12:00", title: "Transport Departs", location: "", note: "" }
      ]
    }

  },

  // =========================================================================
  // FLYING — 12 cadets per day. Add a cadet by putting their number and slot
  // time in the list below. They will see it on their Flying tab and it will
  // appear in their week. Cadets not listed see "no slot allocated".
  // =========================================================================
  flying: {
    location: "AEF",
    note: "Report to your Flight Staff before going.",

    // AEF runs every day, two cadets a day. Add a cadet by putting their
    // number against the day, with their slot time:
    //
    //   "24 Aug": { "012": "09:30", "034": "10:15" },
    //
    // If the time is not confirmed yet, use "TBC" and the slot still shows,
    // at the top of that day, so the cadet knows to expect it.
    //
    //   "24 Aug": { "012": "TBC", "034": "TBC" },
    //
    // A cadet not listed sees "no slot allocated". Nobody sees anyone else's.

    // The order cadets are called forward for AEF. Being on here is not a slot:
    // a cadet sees their position and that the day is still to be confirmed.
    // Once a slot is fixed, put them under the day below and the position is
    // replaced by the real thing.
    // 003, 012, 008, 004, 010, 015 and 002 came off for the 24th: they are not
    // flying and have joined another flight for the day instead.
    priority: [
      "001", "006", "014",
      "005", "007", "011", "013", "009"
    ],

    days: {
      "22 Aug": {},
      "23 Aug": {},

      // Flying on the 24th, in the call-forward order above. Times are not
      // fixed yet, so TBC; replace a cadet's TBC with their time as slots are
      // confirmed. Use "RESERVE" for a standby.
      "24 Aug": {
        "001": "TBC", "006": "TBC", "014": "TBC",
        "005": "TBC", "007": "TBC", "011": "TBC", "013": "TBC", "009": "TBC"
      },

      // Seven flew on the 25th. Three never got airborne and
      // came off; three others went up in their place.
      "25 Aug": {
        "017": "TBC", "026": "TBC", "027": "TBC", "035": "TBC",
        "039": "TBC", "050": "TBC", "051": "TBC"
      },
      // Six on the 26th, every one a first-time flyer aged 13 or over.
      // Two cadets are not on this list, one medically and one on age. A third is
      // back on after missing his slot on the 25th.
      "26 Aug": {
        "020": "TBC", "052": "TBC", "043": "TBC",
        "057": "TBC", "040": "TBC", "053": "TBC"
      },
      "27 Aug": {},
      "28 Aug": {}
    }
  }

};
