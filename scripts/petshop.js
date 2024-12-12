$(document).ready(function () {
  // Load the XML file using AJAX
  $.get("data/pet_list.xml", function (data) {
    const pets = $(data).find("pets");

    // Step 1: Group pets by type
    const groupedPets = {
      cat: [],
      dog: [],
      bird: [],
      rodent: [],
      various: [],
      // Add other pet types here as needed
    };

    // Step 2: Filter pets by type
    pets.each(function () {
      const type = $(this).find("type").text().toLowerCase(); // Make sure the type is lowercase
      const status = $(this).find("status").text();

      if (status === "shop") {
        const pet = {
          name: $(this).find("name").text(),
          colour: $(this).find("colour").text(),
          price: $(this).find("price").text(),
          age: $(this).find("age").text(),
        };

        // Group by pet type
        if (groupedPets[type]) {
          groupedPets[type].push(pet);
        }
      }
    });

    // Step 3: Display the pets grouped by type
    const petContainer = $("#pet-container");
    petContainer.empty(); // Clear existing content

    // Iterate over each pet type and create rows for them
    Object.keys(groupedPets).forEach((type) => {
      const rowTitle = `
            <div class="col-12 mb-3">
                <h3 id="${type}">${capitalizeFirstLetter(type)}s</h3>
            </div>`;
      if (groupedPets[type].length > 0) {
        petContainer.append(rowTitle); // Add title for pet type row

        groupedPets[type].forEach(function (pet, index) {
          // Generate image URL based on type and index (starting from 1)
          const imgSrc = `petshop.pics/${type}/${type}${index + 1}.webp`;

          const petCard = `
            <div class="col-lg-3 mb-4">
              <div class="card">
                <img src="${imgSrc}" class="card-img-top" alt="${pet.name}" loading="lazy"/>
                <div class="card-body text-center">
                  <h5 class="card-title">${pet.name}</h5>
                  <p class="card-text">Color: ${pet.colour}</p>
                  <p class="card-text">Age: ${pet.age} years</p>
                  <p class="card-text"><small class="text-muted">Price: ${pet.price} kr</small></p>
                </div>
              </div>
            </div>
          `;
          petContainer.append(petCard); // Append the pet card
        });
      }
    });
  });

  // Helper function to capitalize the first letter of a string
  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
});
