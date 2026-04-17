let foodCart = [] //ALla valda livsmedel i användarens "matlista"

//Eventlistern för knappar
document.getElementById("add").addEventListener("click", getNutrition)
document.getElementById("saveMeal").addEventListener("click", saveMeal)

showFoodCart()
showSavedMeals()


//Här söker jag först efter livsmedel
function getNutrition() 
{
    const food = document.getElementById("foodInput").value
    const amountInput = document.getElementById("amountInput").value

    //Tar bara siffror från input, har en fallback 100g
    const amount = Number(amountInput.replace(/\D/g, "")) || 100

    if(!food) return

    const url = "https://dataportal.livsmedelsverket.se/livsmedel/api/v1/livsmedel?limit=3000"

    fetch(url)
        .then(response => response.json())
        .then(data => {
            const foods = data.livsmedel

            //filtrerar fram matchandelivsmedel dock max 20 st
            const matches = foods.filter(f => 
                f.namn.toLowerCase().includes(food.toLowerCase())
                && f.namn.toLowerCase().startsWith(food.toLowerCase())
            ).slice(0,20) 

            const resultList = document.getElementById("searchResult")
            resultList.innerHTML = ""
            
            //skapar klickbar lista med matchningar
            matches.forEach(item => {
                const li = document.createElement("li")
                li.innerText = item.namn

                li.onclick = () => {
                    getNutritionFromItem(item, amount)
                    resultList.innerHTML = "" //stänger listan
                }
                resultList.appendChild(li)
            })

            if (matches.length === 0) {
                document.getElementById("result").innerHTML = "Ingen mat hittades"
            }

})
}

//Hämtar näringsvärden från det sökta livsmedlet
function getNutritionFromItem(item, amount)
{

    fetch(`https://dataportal.livsmedelsverket.se/livsmedel/api/v1/livsmedel/${item.nummer}/naringsvarden?sprak=1`)
        .then(res => res.json())
        .then(nutrients => {
            //Visar hela API-svaret (debugg)
            console.log("Alla näringsämnen: ",nutrients)

            nutrients.forEach(n => {
                console.log(n.namn, n.varde, n.enhet)
            })



            const energy = nutrients.find(n => n.namn.toLowerCase().includes("energi")
                && (n.enhet === "kcal" || n.enhet === "KCAL"))
            const caloriesPer100 = Number(energy?.varde) || 0
            const proteinPer100 = Number(nutrients.find(n => n.namn.toLowerCase().includes("protein"))?.varde) || 0
            const fatPer100 = Number(nutrients.find(n => n.namn.toLowerCase().includes("fett"))?.varde) || 0
            const carbsPer100 = Number(nutrients.find(n => n.namn.toLowerCase().includes("kolhydrat"))?.varde) || 0

            
            const nutrition = calculateItemNutrition({
                caloriesPer100,
                proteinPer100,
                fatPer100,
                carbsPer100,
                amount
            })

            const nutritionPer100 = calculateItemNutrition({
                caloriesPer100,
                proteinPer100,
                fatPer100,
                carbsPer100,
                amount:100
            })

            document.getElementById("result").innerHTML = `
            <h3>${item.namn} (${amount}g)</h3>

            <hr>

            <p><b>För ${amount}g:</b></p>
            <p>kcal: ${Math.round(nutrition.calories)}</p>
            <p>Protein: ${nutrition.protein.toFixed(1)}</p>
            <p>Fett: ${nutrition.fat.toFixed(1)}</p>
            <p>Kolhydrater: ${nutrition.carbs.toFixed(1)}</p>
            
            <hr>
            
            <p><b>Per 100g:</b></p>
            <p>kcal: ${Math.round(nutritionPer100.calories)}</p>
            <p>Protein: ${nutritionPer100.protein.toFixed(1)}</p>
            <p>Fett: ${nutritionPer100.fat.toFixed(1)}</p>
            <p>Kolhydrater: ${nutritionPer100.carbs.toFixed(1)}</p>`

            let foodButton = document.createElement("button")
            foodButton.innerText = "Lägg till i lista"
            foodButton.onclick = () => addToFoodCart(
                item.namn, 
                caloriesPer100, 
                proteinPer100, 
                fatPer100, 
                carbsPer100, 
                amount
            )
            document.getElementById("result").appendChild(foodButton)
            showFoodCart()


        })
        .catch(error => {
            console.log(error)
        })

}

function calculateNutrientTotals()
{
    //Metod för att räkna ut totala näringsvärden och slippa dupplicering.
    let totalCalories = 0
    let totalProtein = 0
    let totalFat = 0
    let totalCarbs = 0

    for(let i = 0; i < foodCart.length; i++)
    {
        const item = foodCart[i]

        const factor = item.amount / 100

        totalCalories += item.caloriesPer100 * factor;
        totalProtein += item.proteinPer100 * factor
        totalFat += item.fatPer100 * factor
        totalCarbs += item.carbsPer100 * factor
    }

    return {
        calories : totalCalories,
        protein : totalProtein,
        fat: totalFat,
        carbs: totalCarbs
    }
}

function calculateItemNutrition(item)
{


    const factor = item.amount /100

    return{
        calories : item.caloriesPer100 * factor,
        protein : item.proteinPer100 * factor,
        fat : item.fatPer100 * factor,
        carbs : item.carbsPer100 * factor
    }
}

function addToFoodCart(name, caloriesPer100, proteinPer100, fatPer100, carbsPer100, amount) {
    const mealType = document.getElementById("mealType").value

    //sparar ett livsmedel i listan
    const item = {
        name,
        amount,
        caloriesPer100,
        proteinPer100,
        fatPer100,
        carbsPer100,
        mealType
    }
    foodCart.push(item)
    showFoodCart()
}


function showFoodCart() 
{
    
    let foodHTML = "<h2>Min matlista</h2><li>"

    for (let i = 0; i < foodCart.length; i++) {
        const item = foodCart[i]
        
        //räknar ut akutellt näringsvärde baserat på items mängd
        const nutrition = calculateItemNutrition(item)

        foodHTML += "<div class='actions'>"
        foodHTML += item.mealType + ": " + item.amount + "g " + item.name + "<br>"
       
        //visar upp avrundade/formaterade värden
        foodHTML += "<br> kcal: " + Math.round(nutrition.calories)
        foodHTML += " | P: " + nutrition.protein.toFixed(1)
        foodHTML += " | F: " + nutrition.fat.toFixed(1)
        foodHTML += " | C: " + nutrition.carbs.toFixed(1)

        
        foodHTML += "<a href='#' class='cartbutton delete' onclick='removeFromCart(" + i + ")'>Radera</a><br>"
        foodHTML += "<a href='#' class='cartbutton add' onclick='addQuantity(" + i + ")'>Öka</a><br>"
        foodHTML += "<a href='#' class='cartbutton sub' onclick='substractQuantity(" + i + ")'>Minska</a><br>"
        foodHTML += "</div><br>"  
    }

    foodHTML += "</li>"

    const totals = calculateNutrientTotals()

    foodHTML += "<div class='totals'>"
    foodHTML += "<h3> Totala näringsvärden </h3>"
    foodHTML += "<p> kcal: " + Math.round(totals.calories) + "</p>"
    foodHTML += "<p> Protein: " + Math.round(totals.protein) + "</p>"
    foodHTML += "<p> Fett: " + Math.round(totals.fat) + "</p>"
    foodHTML += "<p> Kolhydrater: " + Math.round(totals.carbs) + "</p>"
    foodHTML += "</div>"

    //renderar html i DOM
    document.getElementById("foodcart").innerHTML = foodHTML

    //visar uppdaterad lista
    showSavedMeals()
}


function removeFromCart(index) {
    foodCart.splice(index, 1)
    showFoodCart()
}


function addQuantity(index)
{
    foodCart[index].amount += 10
    showFoodCart()
}

function substractQuantity(index)
{
    if(foodCart[index].amount > 10)
    {
        foodCart[index].amount-=10
    }
    else
    {
        foodCart.splice(index, 1)
    }
    showFoodCart()
}

//Sparar här måltid i localstorage
function saveMeal() 
{
    if (foodCart.length === 0) {
        alert("Inget att spara!")
        return
    }

    //Räknar ut totala näringsvärden för hela måltiden baserat på varje livsmedels
    //värde per 100g och vald mängd. (i.amount)
    const totals = calculateNutrientTotals()

    //skapar ett "måltidsobjekt" som sparas i localstorage
    const meal = {
        date: new Date().toISOString().split("T")[0],
        mealType: document.getElementById("mealType").value,
        items: [...foodCart], //Kopierar arrayen för att inte råka ändra gamla måltider
        totals: totals
    }

    //hämtar tidigare sparade måltider från localstorage
    let savedMeals = JSON.parse(localStorage.getItem("meals")) || []
    //Lägger till den nya måltiden i arrayen
    savedMeals.push(meal)

    //sparar hela uppdaterade listan till storage igen.
    localStorage.setItem("meals", JSON.stringify(savedMeals))

    //nollställer foodCart igen och visar uppdaterat UI
    foodCart = []
    showFoodCart()
    showSavedMeals()
}

function showSavedMeals() 
{
    //hämtar meals från localstorage, finns det parsar JSON till array, är
    //den null så används en tom array.
    const savedMeals = JSON.parse(localStorage.getItem("meals")) || []

    let html = "<h2>Tidigare måltider</h2>"

    if(savedMeals.length === 0)
    {
        html += "<p>Inga sparade måltider än så länge </p>"
    }

    //tar dom 3 senaste måltiderna(slice -3) från slutet av arrayen
    // vänder ordningen så den nyaste visas först (reverse) och loopar igenom dem.
    //hoppar över måltider som saknar totals
    savedMeals.slice(-3).reverse().forEach(meal => {
        if(!meal.totals) return
        html += `<div class="meal-card">
        <h3>${meal.date} - ${meal.mealType}</h3>
        <p>Antal livsmedel: ${meal.items.length}</p>
        <p>kcal: ${Math.round(meal.totals.calories)}</p>
        <p>P: ${meal.totals.protein.toFixed(1)} |
           F: ${meal.totals.fat.toFixed(1)} |
           C: ${meal.totals.carbs.toFixed(1)}</p>

           <div class="meal-details">
           ${meal.items.map(item => `
            <p>${item.name} (${item.amount} g)</p>
            `).join("")}
           </div>
        </div>`
    })

    document.querySelector(".showSavedMeals").innerHTML = html

}