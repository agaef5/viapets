$(document).ready(function () {
  let buttonClicked = false;
  let availableRoom = null;

  $("#check-availability").on("click", function (event) {
    if (buttonClicked) {
      buttonClicked = false;
      $("#not-available").css("display", "none");
      $("#availability-input").css("display", "block");
      if (availableRoom !== null) {
        $("#available").css("display", "none");
        $("#check-availability")
          .text("Check availability")
          .addClass("btn-success")
          .removeClass("btn-secondary");
        return;
      }
      availableRoom = null;
    }

    event.preventDefault();
    buttonClicked = true;
    console.log("CLICKED"); // Prevent the form from submitting normally

    const startDateRaw = new Date($("#start-date").val());
    console.log("Start Date:", startDateRaw);
    const endDateRaw = new Date($("#end-date").val());

    if (
      startDateRaw == "Invalid Date" ||
      endDateRaw == "Invalid Date" ||
      startDateRaw > endDateRaw
    ) {
      $("#not-available")
        .text("Invalid dates or date range!")
        .css("display", "block");

      buttonClicked = false;

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
      //   });

      // Step 2: Find the first available room
      //   let availableRoom = null;

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
          availableRoom = roomNumber;
          break; // Stop searching; found a free room
        }
      }

      if (availableRoom !== null) {
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
        $("#not-available").css("display", "block");
        buttonClicked = false;
      }
    }).fail(function () {
      console.error("Failed to load XML file.");
    });
  });
});
