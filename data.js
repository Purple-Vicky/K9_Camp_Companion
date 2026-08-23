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
  },

  programme: {

    "22 Aug": {
      uniform: "Civvies",
      items: [
        { time: "13:30", title: "Arrival & check-in", location: "", note: "Packed lunch paperwork • tent allocation" },
        { time: "15:30", title: "Camp Brief & Fire Drill", location: "", note: "" },
        { time: "17:00", title: "Dinner", location: "Dining Facility", note: "Menu TBC", type: "meal" },
        { time: "18:00", title: "Flight Brief", location: "", note: "Then down time and esports" },
        { time: "20:30", title: "Free Time", location: "", note: "" },
        { time: "22:00", title: "Lights Out", location: "", note: "", type: "lightsout" }
      ]
    },

    "23 Aug": {
      uniform: "Civvies",
      items: [
        { time: "07:00", title: "Breakfast", location: "Dining Facility", note: "", type: "meal" },
        { time: "12:00", title: "Lunch", location: "Dining Facility", note: "Menu TBC", type: "meal" },
        { time: "17:00", title: "Dinner", location: "Dining Facility", note: "Menu TBC", type: "meal" },
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
      // Everyone gets these...
      items: [
        { time: "07:00", title: "Breakfast", location: "Dining Facility", note: "", type: "meal" },
        { time: "12:00", title: "Lunch", location: "Dining Facility", note: "Menu TBC", type: "meal" },
        { time: "17:00", title: "Dinner", location: "Dining Facility", note: "Menu TBC", type: "meal" },
        { time: "18:00", title: "Down Time and Esports", location: "", uniform: "Civvies", note: "Flight Sim also running, possible Cinebowl" },
        { time: "20:30", title: "Free Time", location: "", uniform: "Civvies", note: "" },
        { time: "22:00", title: "Lights Out", location: "", note: "", type: "lightsout" }
      ],
      // ...plus their own flight's rotation, merged in and sorted by time.
      flights: {
        A: [
          { time: "08:00", title: "STEM", location: "", note: "" },
          { time: "10:00", title: "Paintball", location: "", note: "" },
          { time: "13:00", title: "Archery", location: "", note: "" },
          { time: "15:00", title: "Leadership", location: "", note: "" }
        ],
        B: [
          { time: "08:00", title: "Leadership", location: "", note: "" },
          { time: "10:00", title: "STEM", location: "", note: "" },
          { time: "13:00", title: "Paintball", location: "", note: "" },
          { time: "15:00", title: "Archery", location: "", note: "" }
        ],
        C: [
          { time: "08:00", title: "Archery", location: "", note: "" },
          { time: "10:00", title: "Leadership", location: "", note: "" },
          { time: "13:00", title: "STEM", location: "", note: "" },
          { time: "15:00", title: "Paintball", location: "", note: "" }
        ],
        D: [
          { time: "08:00", title: "Paintball", location: "", note: "" },
          { time: "10:00", title: "Archery", location: "", note: "" },
          { time: "13:00", title: "Leadership", location: "", note: "" },
          { time: "15:00", title: "STEM", location: "", note: "" }
        ]
      }
    },

    // Taken from the camp admin order, Camp Four serials 61-80.
    // The order groups cadets as Blue, Bronze, Silver and Gold. Those are the
    // flights under other names: A = Blue, B = Bronze, C = Silver, D = Gold.
    "25 Aug": {
      uniform: "Blues",
      // The order calls the flights by colour on this day, so show that.
      flightNames: { A: "Blue", B: "Bronze", C: "Silver", D: "Gold" },
      items: [
        { time: "07:00", end: "08:00", title: "Breakfast", location: "Dining Facility", note: "", type: "meal" },
        { time: "11:30", end: "13:30", title: "Packed Lunch", location: "RAFAC HQ", note: "Collect from Catering Flt", type: "meal" },
        { time: "17:00", end: "18:00", title: "Dinner", location: "Dining Facility", note: "", type: "meal" },
        { time: "18:00", end: "20:30", title: "RAFAC Activities", location: "RAFAC HQ", uniform: "Civvies", note: "" },
        { time: "22:00", title: "Lights Out", location: "", note: "", type: "lightsout" }
      ],
      flights: {
        // Blue
        A: [
          { time: "08:30", end: "10:00", title: "Section Visit", location: "90SU", note: "" },
          { time: "10:00", end: "11:30", title: "Section Visit", location: "34 Sqn", note: "" },
          { time: "13:30", end: "15:00", title: "Section Visit", location: "11 Sqn", note: "" },
          { time: "15:00", end: "16:30", title: "Section Visit", location: "Fire Section", note: "" }
        ],
        // Bronze
        B: [
          { time: "08:30", end: "10:00", title: "Section Visit", location: "34 Sqn", note: "" },
          { time: "10:00", end: "11:30", title: "Section Visit", location: "ATC", note: "" },
          { time: "13:30", end: "15:00", title: "Section Visit", location: "Fire Section", note: "" },
          { time: "15:00", end: "16:30", title: "Section Visit", location: "11 Sqn", note: "" }
        ],
        // Silver
        C: [
          { time: "08:30", end: "10:00", title: "Section Visit", location: "11 Sqn", note: "" },
          { time: "10:00", end: "11:30", title: "Section Visit", location: "Fire Section", note: "" },
          { time: "13:30", end: "15:00", title: "Section Visit", location: "34 Sqn", note: "" },
          { time: "15:00", end: "16:30", title: "Section Visit", location: "ATC", note: "" }
        ],
        // Gold
        D: [
          { time: "08:30", end: "10:00", title: "Section Visit", location: "Fire Section", note: "" },
          { time: "10:00", end: "11:30", title: "Section Visit", location: "11 Sqn", note: "" },
          { time: "13:30", end: "15:00", title: "Section Visit", location: "ATC", note: "" },
          { time: "15:00", end: "16:30", title: "Section Visit", location: "34 Sqn", note: "" }
        ]
      }
    },

    "26 Aug": {
      uniform: "Civvies",
      items: [
        { time: "07:00", title: "Breakfast", location: "Dining Facility", note: "12 cadets flying", type: "meal" },
        { time: "08:00", title: "Travel", location: "", note: "On foot / minibus / TBC" },
        { time: "09:00", title: "York Air Museum / Adventure Training", location: "", uniform: "Sports", note: "Allocation TBC" },
        { time: "12:00", title: "Lunch", location: "Dining Facility", note: "Menu TBC", type: "meal" },
        { time: "13:00", title: "York Air Museum / Adventure Training", location: "", uniform: "Sports", note: "Allocation TBC" },
        { time: "17:00", title: "Dinner", location: "Dining Facility", note: "Menu TBC", type: "meal" },
        { time: "18:00", title: "RAF Presentation", location: "", note: "" },
        { time: "22:00", title: "Lights Out", location: "", note: "", type: "lightsout" }
      ]
    },

    "27 Aug": {
      uniform: "Civvies",
      items: [
        { time: "07:00", title: "Breakfast", location: "Dining Facility", note: "12 cadets flying", type: "meal" },
        { time: "08:00", title: "Travel", location: "", note: "Coach / TBC" },
        { time: "09:00", title: "Adventure Training / York Air Museum", location: "", uniform: "Sports", note: "Groups swap" },
        { time: "12:00", title: "Lunch", location: "Dining Facility", note: "Menu TBC", type: "meal" },
        { time: "13:00", title: "Adventure Training / York Air Museum", location: "", uniform: "Sports", note: "Groups swap" },
        { time: "17:00", title: "Dinner", location: "Dining Facility", note: "Menu TBC", type: "meal" },
        { time: "18:00", title: "Disco", location: "", note: "" },
        { time: "22:00", title: "Lights Out", location: "", note: "", type: "lightsout" }
      ]
    },

    "28 Aug": {
      uniform: "Civvies",
      items: [
        { time: "07:00", title: "Breakfast", location: "Dining Facility", note: "", type: "meal" },
        { time: "08:00", title: "Fireside Chat", location: "", uniform: "Blues", note: "" },
        { time: "08:30", title: "Camp Photo", location: "", uniform: "Blues", note: "" },
        { time: "09:00", title: "Parade", location: "", uniform: "Blues", note: "" },
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
    location: "",
    note: "Report point and time to be confirmed.",
    days: {
      "26 Aug": {
        // "001": "09:30",
        // "014": "09:30",
      },
      "27 Aug": {
        // "032": "10:15",
      }
    }
  }

};
