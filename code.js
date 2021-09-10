/* 
 * Name: Ariel Vetshchaizer
 * Date: July 3rd, 2021
 */

/*
 * Purpose: To create a string from a file/website API
 * Param: path = the file name / the URL
 * Param: isFile = checks if path is a file or a URL
 * Return: text[] = array of text extracted from file 
 * Addapted from: https://stackoverflow.com/a/14446538
 */
const readDestination = (path,isFile) => {
    let text;
    const source = new XMLHttpRequest();

    if (isFile == true)
        source.open("GET", `/SCHEDULES/${path}.txt`, false);
    else 
        source.open("GET", path, false);

    source.onreadystatechange = function () {
        if (source.readyState === 4 && source.status === 200)
            text = source.responseText;
        else
            text = 404;
    }
    source.send(null);
    return text;
}


/* 
 * Purpose: to create an object containing all relevant info to specialization
 * Parm: specialization = the specialization you wana retrieve
 * Return: myObject = the object containing all the relevant info 
*/
const makeObject = specialization => {

    let lines = readDestination(specialization, true);

    //Error Check
    if (lines == 404) 
        return 404;
    else 
        lines = lines.split("\r\n");

    let year_num;
    let term_num;
    let extra_num = 0;

    // Defining Object
    let myObject = {
        title: lines[0].replace("[TITLE] ", ""),
        schedule: {
            main: {},
            side: {}
        }
    };

    //Fills up with Classes
    for (let i = 0, n = lines.length; i < n; i++) {
        // Checks for Complementary Courses
        if (lines[i].includes("[COMP]")) {
            myObject.schedule.side.complementary = [];
            do {
                i++;
                myObject.schedule.side.complementary.push(lines[i]);
            } while (lines[i + 1] != "" && lines[i + 1][0] != "[");
        };

        // Checks for Elective Courses
        if (lines[i].includes("[ELECTIVES]")) {
            myObject.schedule.side.electives = [];
            do {
                i++;
                myObject.schedule.side.electives.push(lines[i]);
            } while (lines[i + 1] != "" && lines[i + 1][0] != "[");
        };

        // Checks for Year Heading
        if (lines[i].includes("[YEAR]")) {

            //defines year property of object
            year_num = "Year_" + lines[i].replace("[YEAR] ", "")

            myObject.schedule.main[year_num] = {};
        };

        //Checks for terms
        if (lines[i].includes("[TERM]")) {

            //Defines Term property of 
            term_num = "Term_" + lines[i].replace("[TERM] ", "")
            myObject.schedule.main[year_num][term_num] = [];

            do {
                i++;
                myObject.schedule.main[year_num][term_num].push(lines[i]);
            } while (lines[i + 1] != "");
        };

        //Checks for EXTRAS
        if (lines[i].includes("[EXTRA]")) {

            //Defines Extra property of object 
            myObject.schedule.main[year_num].extra = {};
            do {
                i++;
                //Looks for Text Boxes to object
                if (lines[i] != "") {
                    //Cretaes the String and Course array
                    myObject.schedule.main[year_num].extra[extra_num] = {};

                    if (lines[i].includes("[TEXT]")) {
                        myObject.schedule.main[year_num].extra[extra_num].string = lines[i].replace("[TEXT] ", "");

                        //Adds Courses to the object
                        if (lines[i + 1] != "" && lines[i + 1][0] != '[') {
                            myObject.schedule.main[year_num].extra[extra_num].courses = [];
                            do {
                                i++;
                                myObject.schedule.main[year_num].extra[extra_num].courses.push(lines[i]);
                            } while (lines[i + 1] != "" && !lines[i + 1].includes("[TEXT]"));
                        }
                    }
                    else {
                        myObject.schedule.main[year_num].extra[extra_num].courses = [];
                        myObject.schedule.main[year_num].extra[extra_num].courses.push(lines[i]);
                    }
                }
                //Increases extras
                extra_num++;
            } while (lines[i + 1].includes("[TEXT]"));

            //Resets Extras
            extra_num = 0;
        };

    }

    console.log(myObject);
    return myObject;
}

/* 
 * Purpose: To create the table in HTML 
 * Parm: specialization = the specialization you wana retrieve
 */

const makeTable = specialization => {

    let data = makeObject(specialization);

    // Error Check
    if (data == 404) {
        $('#container').remove();
        $('body').append('<div id="container">ERROR 404! Calendar Does Not Exist</div>');
    }

    let title = data.title;
    let mainTable = data.schedule.main;
    let sideBar = data.schedule.side;

    // Creates Overall Container for Everything
    $('#container').remove();
    $('body').append('<div id="container"></div>');

    //Creates title
    $('#container').append(`<h1 id="title">${title}</h1>`);

    //Creates main calendar
    $('#container').append('<div id="main-box"></div>'); //Remember ID

    $('#main-box').append('<table id=calendar border:1></table>'); //Remember ID
    $('#calendar').append('<tbody></tbody>');

    //Fills Up calendar
    for (let year in mainTable) {
        //Create table rows with TEMPORARY IDS
        $('#calendar tbody').append(`<tr id="CurrentHeading"></tr>`)
        $('#calendar tbody').append(`<tr id="CurrentCourses"></tr>`)

        //Cretes Year Heading Block
        $(`#CurrentHeading`).append(`<th rowspan="2" class="year">${year.replace("_", " ")}</th>`);

        for (let session in mainTable[year]) {

            //Creates Containers for classes (where buttons will be)
            $(`#CurrentCourses`).append(`<th id="CurrentSession" class="session_content"></th>`);
            

            //Adds Classes to to the container
            if (session == "extra") {

                //Generates Extra Heading
                $(`#CurrentHeading`).append(`<th class="session_heading">Extra Courses</th>`);

                // Creates the div boxes and fills them with strings
                for (let index in mainTable[year][session]) {
                    //Boundry box for text and the string attached to it as div
                    $(`#CurrentSession`).append(`<div id="CurrentIndex" class="info-box"></div>`);

                    if ('string' in mainTable[year][session][index]) {
                        $(`#CurrentIndex`).append(`<h3 class="instructions">${mainTable[year][session][index].string}</h3>`);
                    }

                    //if Finds a course property, adds courses
                    if ('courses' in mainTable[year][session][index]) {
                        $(`#CurrentIndex`).append(`<div class="button-box"></div>`);
                        for (let i = 0, n = mainTable[year][session][index].courses.length; i < n; i++) {
                            let class_code = mainTable[year][session][index].courses[i];
                            $(`#CurrentIndex div`).append(`<button class="${class_code.replace(" ", "")} courses BaseButtonColor">${class_code}</button>`);
                        }
                    }

                    //Removes Temporary ID from Table Content
                    $("#CurrentIndex").removeAttr('id');
                }
            }
            //Term 1 and Term 2 Classes
            else {
                //generates term headings
                $(`#CurrentHeading`).append(`<th class="session_heading">${session}</th>`);  //Remember This Class
            
                // Adds classes for Regular terms
                $(`#CurrentSession`).append(`<div class="button-box"></div>`);
                for (let i = 0, n = mainTable[year][session].length; i < n; i++) {
                    let class_code = mainTable[year][session][i];
                    $(`#CurrentSession div`).append(`<button class="${class_code.replace(" ", "")} courses BaseButtonColor">${class_code}</button>`);
                }
            } 
            $("#CurrentSession").removeAttr('id');
        }

        //removes TEMPORARY IDS
        $("#CurrentHeading").removeAttr('id');
        $("#CurrentCourses").removeAttr('id');
    }

    //Creates side bar
    $('#container').append('<div id="side-bar"></div>'); //Remember ID

    for (let type in sideBar) {
        $(`#side-bar`).append(`<div id="${type}"></div>`);
        $(`#${type}`).append(`<h3 class="side-bar-headings">${type}</h3>`);
        $(`#${type}`).append(`<div class="button-box"></div>`);

        for (let i = 0, n = sideBar[type].length; i < n; i++) {
            $(`#${type} div`).append(`<button class="${sideBar[type][i].replace(" ", "")} courses BaseButtonColor">${sideBar[type][i]}</button>`);
        }

    }
    
    //Creates Bottom  bar
    $('#container').append('<div id="bottom-bar"></div>'); //Remember ID
}


/* 
 * Purpose: to change the colours of the buttons to reflect their relationship with the inputed course
 * Param: course_name = the inputed course we we selected when the button was pressed
 */
const RunButton = course_name => {

    let DEPT = course_name.substring(0, course_name.indexOf(" "));
    let CODE = course_name.substring(course_name.indexOf(" ") + 1);
    let APItext = readDestination(`https://ubcexplorer.io/getCourseInfo/${DEPT}%20${CODE}`, false); 

    $(".courses").removeClass("selected");
    $(".courses").removeClass("prereq");
    $(".courses").removeClass("coreq");
    $(".courses").removeClass("postreq");
    $(`.${course_name.replace(" ", "")}`).addClass("selected");

    if (APItext == "Course not found") {
        alert("Class Not in DataBase");
        return;
    }    
    
    let class_list = JSON.parse(APItext);
    
    for (let i = 0, n = class_list.preq.length; i < n; i++)
        $(`.${class_list.preq[i].replace(" ", "")}`).addClass("prereq");
    

    for (let i = 0, n = class_list.creq.length; i < n; i++)
        $(`.${class_list.creq[i].replace(" ", "")}`).addClass("coreq");
    

    for (let i = 0, n = class_list.depn.length; i < n; i++)
        $(`.${class_list.depn[i].replace(" ", "")}`).addClass("postreq");
    
}


/* 
 * Purpose: an Event Listener waiting for button presses
 */
document.addEventListener("click", () => {
    // Runs the command for a specialization button
    $(".specialization").off().click(function () {
        makeTable(this.innerText)
    });

    // Runs the command for a course button
    $(".courses").off().click(function () {
        RunButton(this.innerText);
    });

}, true);


//Copy of makeTable with IDs
/* 
const makeTable = specialization => {

    let data = makeObject(specialization);

    // Error Check
    if (data == 404) {
        $('#container').remove();
        $('body').append('<div id="container">ERROR 404! Calendar Does Not Exist</div>');
    }

    let title = data.title;
    let mainTable = data.schedule.main;
    let sideBar = data.schedule.side;

    // Creates Overall Container for Everything
    $('#container').remove();
    $('body').append('<div id="container"></div>');

    //Creates title
    $('#container').append(`<h1 id="title">${title}</h1>`);

    //Creates main calendar
    $('#container').append('<div id="main-box"></div>'); //Remember ID

    $('#main-box').append('<table id=calendar border:1></table>'); //Remember ID
    $('#calendar').append('<tbody></tbody>');

    //Fills Up calendar
    for (let year in mainTable) {
        //Create table rows
        $('#calendar tbody').append(`<tr id="${year}_headings"></tr>`)
        $('#calendar tbody').append(`<tr id="${year}_courses"></tr>`)

        //Cretes Year Heading Block
        $(`#${year}_headings`).append(`<th rowspan="2" class="year">${year.replace("_", " ")}</th>`);

        for (let session in mainTable[year]) {

            //Creates Containers for classes (where buttons will be)
            $(`#${year}_courses`).append(`<th id="${year}_${session}" class="session_content"></th>`);
            $(`#${year}_${session}`).append(`<div class="button-box"></div>`);

            //Adds Classes to to the container
            if (session == "extra") {

                //Generates Extra Heading
                $(`#${year}_headings`).append(`<th class="session_heading">Extra Courses</th>`);

                // Creates the div boxes and fills them with strings
                for (let index in mainTable[year][session]) {
                    //Boundry box for text and the string attached to it as div
                    $(`#${year}_${session}`).append(`<div id="${year}_${session + index}" class="info-box"></div>`);

                    if ('string' in mainTable[year][session][index]) {
                        $(`#${year}_${session + index}`).append(`<h3 class="instructions">${mainTable[year][session][index].string}</h3>`);
                    }

                    //if Finds a course property, adds courses
                    if ('courses' in mainTable[year][session][index]) {
                        $(`#${year}_${session + index}`).append(`<div class="button-box"></div>`);
                        for (let i = 0, n = mainTable[year][session][index].courses.length; i < n; i++) {
                            let class_code = mainTable[year][session][index].courses[i];
                            $(`#${year}_${session + index} > div`).append(`<button class="${class_code.replace(" ", "")} courses BaseButtonColor">${class_code}</button>`);
                        }
                    }
                }
            }
            //Term 1 and Term 2 Classes
            else {
                //generates term headings
                $(`#${year}_headings`).append(`<th class="session_heading">${session}</th>`);  //Remember This Class

                // Adds classes for Regular terms
                for (let i = 0, n = mainTable[year][session].length; i < n; i++) {
                    let class_code = mainTable[year][session][i];
                    $(`#${year}_${session} > div`).append(`<button class="${class_code.replace(" ", "")} courses BaseButtonColor">${class_code}</button>`);
                }
            }
        }
    }

    //Creates side bar
    $('#container').append('<div id="side-bar"></div>'); //Remember ID

    for (let type in sideBar) {
        $(`#side-bar`).append(`<div id="${type}"></div>`);
        $(`#${type}`).append(`<h3 class="side-bar-headings">${type}</h3>`);
        $(`#${type}`).append(`<div class="button-box"></div>`);

        for (let i = 0, n = sideBar[type].length; i < n; i++) {
            $(`#${type} > div`).append(`<button class="${sideBar[type][i].replace(" ", "")} courses BaseButtonColor">${sideBar[type][i]}</button>`);
        }

    }


    //Creates Bottom  bar
    $('#container').append('<div id="bottom-bar"></div>'); //Remember ID
}
*/
