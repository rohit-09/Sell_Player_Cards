const login = require('../variables/login.json');

var playerName = "";
var playerRating = "";


describe('selling player cards in fifa ultimate team', () => {
    
    it("should navigate to EA FIFA web app", async () => {
        await browser.deleteAllCookies();
        await browser.maximizeWindow();
        await browser.url("https://www.ea.com/fifa/ultimate-team/web-app/");                  //navigate to EA fut web app
        await $("//button[text()='Login']").waitForDisplayed({timeout:10000});
        await expect(browser).toHaveTitle("FC Ultimate Team Web App - EA SPORTS Official Site");
    });


    it("should login the web app", async () => {
        await $("//button[text()='Login']").waitForClickable({timeout:10000});
        await $("//button[text()='Login']").click();
        await $("//input[@id='email']").waitForExist({timeout:10000});
        await $("//input[@id='email']").setValue(login.username);                             //type email
        // await $("//input[@id='password']").setValue(password);                             //type password
        await $("//input[@id='rememberMe']").click({x:0});                                    //uncheck remember me
        // await $("//a[@id='logInBtn']").click();                                            //sign in
        //user needs to input password and login manually
        await $("//label[@id='APPLabel']").waitForExist({timeout:300000});                    //wait until user inputs password and clicks on login
        await $("//label[@id='APPLabel']").click();                                           //select authenticator
        await $("//a[@id='btnSendCode']").click();                                            //send code
        await browser.pause(1000);
        await $("//input[@id='trustThisDevice']").click({x:0});                               //uncheck remember device
        await $("//input[@id='twoFactorCode']").click();                                      //click on 6 digit code field
        // await browser.pause(9000);
        // await $("//a[@id='btnSubmit']").click();                                           //submit
        await $("//button/*[contains(text(),'Transfers')]/..").waitForExist({timeout:300000});//wait until user inputs code and signs in
        // await browser.pause(25000);
        await expect($("//h1")).toHaveText("Home");
    });


    it('should navigate to transfers and start selling players', async () => {
        await $("//button/*[contains(text(),'Transfers')]/..").click();                     //go to transfers
        await browser.pause(3000);
        await $("//h1[text()='Transfer List']").waitForClickable({timeout:10000});
        await $("//h1[text()='Transfer List']").click({x:0});                               //go to transfer list
        await browser.pause(5000);
        const itemList = await $("//header/*[contains(text(),'Available Items')]/../..//ul[@class='itemList']");
        await itemList.waitForExist({timeout:10000});
        const numberOfItems = await itemList.$$("//li[@class='listFUTItem']").map(element => element);  //get total number of items
        for(var i=0; i<=numberOfItems.length; i++){
            try {//to see if item on focus is from available items
                await $("//li[@class='listFUTItem selected']//div[@class='name']").scrollIntoView({block:'center'});
                playerRating = await $("//li[@class='listFUTItem selected']//div[@class='rating']").getText();  //get player rating
                playerName = await getPlayerName();
            } catch (error) {//if item on focus is from sold items
                await $("//button[text()='Clear Sold']").click();                           //clear players that are sold
                await browser.pause(2000);
                playerRating = await $("//li[@class='listFUTItem selected']//div[@class='rating']").getText();  //get player rating
                playerName = await getPlayerName();
            }
            await $("//button/*[contains(text(),'Transfers')]/..").click();                 //go back to transfers
            await browser.pause(2000);
            await $("//h1[text()='Search the Transfer Market']").click({x:0});              //go to search the transfer market
            await browser.pause(1000);
            await $("//input[@placeholder='Type Player Name']").setValue(playerName);   //input player name in search
            await browser.pause(1000);
            await $("//span[text()='"+playerName+"']/..//span[text()='"+playerRating+"']/..").click();  //click on the player on dropdown
            var price = 700;
            var sellingPrice = 0;
            var found = false;
            while(!found){                                                                  //until the player is found in market
                await $("(//span[text()='Max:'])[2]/../..//input").click();                 //click on max buy now price
                await browser.pause(1000);
                await $("(//span[text()='Max:'])[2]/../..//input").clearValue();            //clear any previous inputs
                await browser.pause(1000);
                await $("(//span[text()='Max:'])[2]/../..//input").setValue(price);         //set value from lowest and increasing
                await $("//button[text()='Search']").click();                               //click on search
                await browser.pause(2000);
                const notFoundElem = await $("//h2[text()='No results found']");            //if no results found
                if(await notFoundElem.isExisting()){
                    await $("//h1[text()='Search Results']/..//button[1]").click();         //go back
                    if(price<1000){//as price goes higher, increase price increment
                        price = price + 50;
                    }
                    else if(price<2000){
                        price = price + 100;
                    }
                    else if(price<5000){
                        price = price + 200;
                    }
                    else if(price<10000){
                        price = price + 500;
                    }
                    else{
                        break;
                    }
                }
                else{
                    found = true;                                            //set price as final selling price when found
                    sellingPrice = price;
                }
            }
            await $("//button/*[contains(text(),'Transfers')]/..").click();                     //go to transfers
            await browser.pause(2000);
            await $("//h1[text()='Transfer List']").click({x:0});                               //go to transfer list
            await browser.pause(2000);
            try {//in case listed players are sold whilst selling current player
                await sellProcess(sellingPrice);
            } catch (error) {//if a listed player is sold, clear sold and attempt sale again
                await $("//button[text()='Clear Sold']").click();                           //clear players that are sold
                await browser.pause(2000);
                await sellProcess(sellingPrice);
            }
        }
        await expect($("//h1")).toHaveText("Hom");
    });

});


async function getPlayerName() {
    var playerName = await $("//li[@class='listFUTItem selected']//div[@class='name']").getText();  //get selected player's name
    //the above line is needed in case the selected item is a sold item. if so, the catch statement in main code will clear sold
    await $("//button/*[contains(text(),'Player Bio')]/..").waitForExist({timeout:5000});
    await $("//button/*[contains(text(),'Player Bio')]/..").waitForClickable({timeout:5000});
    await $("//button/*[contains(text(),'Player Bio')]/..").click();                                //click on player bio
    await browser.pause(1000);
    var knownAs = await $("//li/*[contains(text(),'Known As')]/..//h2").getText();                  //get known as
    if(knownAs=="---"){//if the player does not have a known as, get the full name
        playerName = await $("//li/*[contains(text(),'Full Name')]/..//h2").getText();              //get full name
    }
    else{//or else use known as as the player's name
        playerName = knownAs;                                                                       //use known as
    }
    return playerName;
}

async function sellProcess(sellingPrice){
    await $("//button/*[contains(text(),'List on Transfer Market')]/..").click();       //click on list on transfer market
    await browser.pause(1000);
    await $("//div/*[contains(text(),'Buy Now Price')]/../..//input").click();          //click on buy now price
    await browser.pause(1000);
    await $("//div/*[contains(text(),'Buy Now Price')]/../..//input").setValue("\uE003"+"\uE003"+"\uE003"+"\uE003"+"\uE003");//backspace unicode 5 times to remove default value of 5 digits
    await browser.pause(1000);
    await $("//div/*[contains(text(),'Buy Now Price')]/../..//input").setValue(sellingPrice);   //set selling price to buy now price
    await browser.pause(1000);
    await $("//button[text()='List for Transfer']").click();                            //click on list for transfer
    await browser.pause(3000);
}