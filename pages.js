"use strict";

/**
 *  A simple object to manage page content. At present,
 * we don't have a Content Management Service/back-end,
 * so this file might change soon.
 */

const PageDataHelper =
{
    loaded: true,
    awaitLoad: () =>
    new Promise((resolve, reject) =>
    {
        // We don't have a backend/CMS yet,
        //so for now, just resolve with the data.
        resolve(PageDataHelper.pages);
    }),
    
    pageBackgrounds: {"About": "empty", "Events": "logoAndWalls", "Join": "logo"},
    pages:
    {
        "About":
        `
            <h1>About</h1>
            <h2>Our Mission</h2>
            <center><i>To provide an inclusive environment where the beginner and the experienced alike can learn and participate in the design, development, marketing, launching, and operating processes of real-world, market-suitable mobile apps.</i></center>
        `,
        
        "Events":
        `
            <h1>Local Hack Day: Build @ UW</h1>
            <hr/>
            <h2>Overview</h2>
            <p>On December 7<sup>th</sup> from 8:00 AM to 9:00 PM, the University of Washington's
               Mobile Development Club will be hosting a hackathon!</p>
            <button class = "hugeButton" onclick = "window.open('https://localhackday.mlh.io/build/locations/2874/');">Register</button>
            
            <h2>Planned Schedule</h2>
            <ul style = "font: 11pt mono, monospace, courier, sans;">
                <li><b>8:00 &nbsp;AM</b> Check-in and registration!</li>
                <li><b>8:45 &nbsp;AM</b> Opening Ceremony</li>
                <li><b>10:00 AM</b> <i>Optional Workshop:</i> iOS Development with Swift and SwiftUI</li>
                <li><b>10:00 AM</b> <i>Optional Workshop:</i> CSE 142 Study Group</li>
                <li><b>11:00 AM</b> <i>Optional Workshop:</i> Android Development with Java</li>
                <li><b>11:00 AM</b> <i>Optional Workshop:</i> How to Collaborate with GitHub</li>
                <li><b>1:00 &nbsp;PM</b> Lunch Break</li>
                <li><b>1:00 &nbsp;PM</b> <i>Optional Workshop:</i> Build and Deploy Node.js Apps with Microsoft Azure.</li>
                <li><b>2:00 &nbsp;PM</b> <i>Optional Workshop:</i> CSE 143 Study Group</li>
                <li><b>2:00 &nbsp;PM</b> <i>Optional Workshop:</i> Python: Basic Training <span class = "dash"></span> Intro to Python Skills for AI</li>
                <li><b>3:00 &nbsp;PM</b> <i>Optional Workshop:</i> Add an FAQ Bot to Your Webpage with Microsoft Azure</li>
                <li><b>6:00 &nbsp;PM</b> Dinner Break</li>
                <li><b>8:00 &nbsp;PM</b> End of Hacking, Start of Demos</li>
                <li><b>8:30 &nbsp;PM</b> Awards!</li>
                <li><b>9:00 &nbsp;PM</b> Event Ends</li>
            </ul>
            
            <h2>Notes</h2>
            <ul>
            <li>
                Many students have a math midterm on December 7<sup>th</sup>!
                Think of the hackathon as a way to de-stress before or after your midterm.
                Even several of the organizers will be leaving for midterms! If you need
                to leave early or arrive late, this is expected. Come.
            </li>
            <li>
                The schedule isn&rsquo;t finished <span class = "dash"></span> it
                might change before the event.
            </li>
            <li>
                To attend, you must be a student at the University of Washington.
            </li>
            </ul>
            
            <sub style = "font-family: sans;">Questions? <a href = "https://huskylink.washington.edu/organization/appdev/">Contact us!</a></sup>
        `,
        
        "Join":
        `
            <h1>Join</h1>
            <p>Visit our Registered Student Organization Page (on the Husky Union Building's Website) to join!</p>
            
        `
    },
    
    defaultPage: "Events"
};
