let reservationStart = null;
let reservationEnd = null;

$(document).ready(function () {
  let infoDivDisplayed = false;
  let availableRooms = 0;

  $.get("data/reservation_list.xml", function (data) {
    const todayReservations = parseReservationsForToday(data);

    // Example: Check available rooms
    const totalRooms = 10;
    const reservedRooms = todayReservations;
    const availableRooms = totalRooms - reservedRooms;

    $("#today-availability").text(`Rooms available today: ${availableRooms}`);
  }).fail(function () {
    console.error("Failed to load XML data.");
  });

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

    $.get("data/reservation_list.xml", function (data) {
      const reservations = $(data).find("reservationList");

      // Step 1: Group reservations by room
      const roomReservations = {};
      reservations.each(function () {
        const roomNumber = parseInt(
          $(this).find("kennelRoom roomNumber").text(),
          10
        );

        const dropoffMonth =
          parseInt($(this).find("dropOfDate month").text(), 10) - 1;
        const dropoffYear = parseInt(
          $(this).find("dropOfDate year").text(),
          10
        );
        const dropoffDay = parseInt($(this).find("dropOfDate day").text(), 10);
        const reservationStart = new Date(
          dropoffYear,
          dropoffMonth,
          dropoffDay
        );

        const pickupMonth =
          parseInt($(this).find("pickUpDate month").text(), 10) - 1; // Month is zero-based
        const pickupYear = parseInt($(this).find("pickUpDate year").text(), 10);
        const pickupDay = parseInt($(this).find("pickUpDate day").text(), 10);
        const reservationEnd = new Date(pickupYear, pickupMonth, pickupDay);

        if (!reservationStart || !reservationEnd) return;

        if (!roomReservations[roomNumber]) {
          roomReservations[roomNumber] = [];
        }
        if (startDate <= reservationEnd && endDate >= reservationStart) {
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

  function parseReservationsForToday(data) {
    const reservations = $(data).find("ReservationList reservationList");
    const roomReservations = {};
    let todayReservations = 0;

    // Get today's date
    const today = new Date().setHours(0, 0, 0, 0); // Normalize to midnight for accurate comparisons

    reservations.each(function () {
      const roomNumber = parseInt($(this).find("roomNumber").text(), 10);

      const dropoffMonth =
        parseInt($(this).find("dropOfDate month").text(), 10) - 1;
      const dropoffYear = parseInt($(this).find("dropOfDate year").text(), 10);
      const dropoffDay = parseInt($(this).find("dropOfDate day").text(), 10);
      const reservationStart = new Date(dropoffYear, dropoffMonth, dropoffDay);

      const pickupMonth =
        parseInt($(this).find("pickUpDate month").text(), 10) - 1;
      const pickupYear = parseInt($(this).find("pickUpDate year").text(), 10);
      const pickupDay = parseInt($(this).find("pickUpDate day").text(), 10);
      const reservationEnd = new Date(pickupYear, pickupMonth, pickupDay);

      console.log("today", reservationStart);

      if (!roomReservations[roomNumber]) {
        roomReservations[roomNumber] = [];
      }

      // If reservation falls on today, add it to the list
      if (today >= reservationStart && today <= reservationEnd) {
        roomReservations[roomNumber].push({
          start: new Date(reservationStart),
          end: new Date(reservationEnd),
        });

        todayReservations++;
        console.log(
          `Room ${roomNumber} is reserved from ${new Date(
            reservationStart
          ).toLocaleDateString()} to ${new Date(
            reservationEnd
          ).toLocaleDateString()}`
        );
      }
    });

    return todayReservations;
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

    // Update date pickers
    updateInputs();
    // Update calendar
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

    // Update date pickers
    updateInputs();
    // Updaate calendar
    manipulate();
  });

  const updateInputs = () => {
    $("#start-date").val(
      new Date(reservationStart).toISOString().split("T")[0]
    );
    $("#end-date").val(new Date(reservationEnd).toISOString().split("T")[0]);
  };
});
