let reservationStart = null;
let reservationEnd = null;

$(document).ready(function () {
  let infoDivDisplayed = false;
  let availableRooms = 0;

  checkTodayAvailability();

  $("#check-availability").on("click", function (event) {
    if (infoDivDisplayed) {
      $("#not-available").css("display", "none");
      $("#availability-input").css("display", "block");
      infoDivDisplayed = false;
      if (availableRooms != 0) {
        $("#available").css("display", "none");
        $("#check-availability")
          .text("Check availability")
          .addClass("btn-success")
          .removeClass("btn-secondary");
        return;
      }
    }
    event.preventDefault();

    const startDateRaw = new Date($("#start-date").val());
    const endDateRaw = new Date($("#end-date").val());
    const amountOfPets = $("#petsAmount").val();
    availableRooms = 0;

    if (
      startDateRaw == "Invalid Date" ||
      endDateRaw == "Invalid Date" ||
      startDateRaw > endDateRaw
    ) {
      $("#not-available")
        .text("Invalid dates or date range!")
        .css("display", "block");
      infoDivDisplayed = true;
      return;
    }

    const startDate = new Date(startDateRaw);
    const endDate = new Date(endDateRaw);

    $.get("data/kennelreservations.xml", function (data) {
      const reservations = $(data).find("reservation");

      // Step 1: Group reservations by room
      const roomReservations = {};
      reservations.each(function () {
        const roomNumber = parseInt($(this).find("roomNumber").text(), 10);
        const reservationStart = new Date($(this).find("startDay").text());
        const reservationEnd = new Date($(this).find("endDay").text());

        if (!roomReservations[roomNumber]) {
          roomReservations[roomNumber] = [];
        }
        if (startDate <= reservationEnd || endDate >= reservationStart) {
          roomReservations[roomNumber].push({
            start: reservationStart,
            end: reservationEnd,
          });
        }
      });

      // Step 2: Find the first available room
      for (let roomNumber = 1; roomNumber <= 10; roomNumber++) {
        const reservations = roomReservations[roomNumber] || [];
        let isRoomAvailable = true;

        for (const booking of reservations) {
          // Check if the user's date range overlaps with any booking
          if (startDate <= booking.end && endDate >= booking.start) {
            isRoomAvailable = false;
            break; // Stop checking this room; it's booked
          }
        }

        if (isRoomAvailable) {
          availableRooms++;
          if (availableRooms == amountOfPets) break;
          // Stop searching; found a free room
        }
      }

      if (availableRooms >= amountOfPets) {
        $("#chosen-period").text(
          "(" +
            startDate.toLocaleDateString() +
            " - " +
            endDate.toLocaleDateString() +
            ")"
        );
        $("#available").css("display", "block");
        $("#availability-input").css("display", "none");
        $("#check-availability")
          .text("Check other dates")
          .addClass("btn-secondary")
          .removeClass("btn-success");
      } else {
        $("#not-available")
          .css("display", "block")
          .text(
            "Unfortunately, there are no free \n places available during this period. \n Try other dates."
          );
      }
      infoDivDisplayed = true;
    }).fail(function () {
      console.error("Failed to load XML file.");
    });
  });

  function checkTodayAvailability() {
    const today = new Date().toISOString().split("T")[0]; // Get today's date in 'yyyy-MM-dd' format
    $.get("data/kennelreservations.xml", function (data) {
      const roomReservations = parseReservations(data, today, today);
      let todayAvailableRooms = 0;

      for (let roomNumber = 1; roomNumber <= 10; roomNumber++) {
        const reservations = roomReservations[roomNumber] || [];
        let isRoomAvailable = true;

        for (const booking of reservations) {
          if (today >= booking.start && today <= booking.end) {
            isRoomAvailable = false;
            break;
          }
        }

        if (isRoomAvailable) todayAvailableRooms++;
      }

      // Display static availability info
      $("#today-availability").text(
        `Rooms available today: ${todayAvailableRooms}`
      );
    }).fail(function () {
      console.error("Failed to load XML file.");
    });
  }

  function parseReservations(data, startDate, endDate) {
    const reservations = $(data).find("reservation");
    const roomReservations = {};

    reservations.each(function () {
      const roomNumber = parseInt($(this).find("roomNumber").text(), 10);
      const reservationStart = new Date($(this).find("startDay").text());
      const reservationEnd = new Date($(this).find("endDay").text());

      if (!roomReservations[roomNumber]) {
        roomReservations[roomNumber] = [];
      }
      if (startDate <= reservationEnd || endDate >= reservationStart) {
        roomReservations[roomNumber].push({
          start: reservationStart,
          end: reservationEnd,
        });
      }
    });
    return roomReservations;
  }

  $(".calendar-dates").on("click", ".date", function () {
    const selectedDateRaw = $(this).attr("id");

    // Parse the `dd/mm/yyyy` format manually
    const parts = selectedDateRaw.split("/"); // Split the input string by "/"
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Month is zero-based
    const year = parseInt(parts[2], 10);

    let selectedDate = new Date(year, month, day).toLocaleDateString();

    if (selectedDate == reservationStart && selectedDate == reservationEnd) {
      reservationStart = null;
      reservationEnd = null;
    } else if (selectedDate == reservationEnd) {
      reservationEnd = reservationStart;
    } else if (selectedDate == reservationStart) {
      reservationStart = reservationEnd;
    } else if (reservationStart == null && reservationEnd == null) {
      reservationStart = selectedDate;
      reservationEnd = selectedDate;
    } else if (reservationStart != null && selectedDate > reservationStart) {
      reservationEnd = selectedDate;
    } else if (selectedDate < reservationStart) {
      reservationStart = selectedDate;
    }

    if (
      new Date(reservationEnd).getTime() < new Date(reservationStart).getTime()
    ) {
      var temp = reservationEnd;
      reservationEnd = reservationStart;
      reservationStart = temp;
    }

    updateInputs();

    manipulate();
  });

  $(".datepicker").change(function () {
    const id = $(this).attr("id");

    if (id == "start-date") {
      reservationStart = new Date($("#start-date").val()).toLocaleDateString();
      if (reservationEnd == null) reservationEnd = reservationStart;
    } else if (id == "end-date") {
      reservationEnd = new Date($("#end-date").val()).toLocaleDateString();
      if (reservationStart == null) {
        reservationStart = reservationEnd;
      }
    }

    updateInputs();
    manipulate();
  });

  const updateInputs = () => {
    $("#start-date").val(
      new Date(reservationStart).toISOString().split("T")[0]
    );
    $("#end-date").val(new Date(reservationEnd).toISOString().split("T")[0]);
  };
});
