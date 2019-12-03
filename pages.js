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
        <p>On December 7<sup>th</sup> from 8:00 AM to 9:00 PM, 
           Mobile Development Club will be hosting a hackathon! Come to get <strong>swag and laptop stickers</strong>, study for finals together, or learn something new through our workshops, 
           build something awesome, and win prizes like the <strong>Amazon Echo Dot</strong>, and more!</p>
        <button class = "hugeButton" onclick = "window.open('http://organize.mlh.io/participants/events/2874-local-hack-day-uw/register');">Register for FREE</button>

        <div id="schedule">
        <h2>Schedule</h2>
            <ul class="lhdSchedule">
                <li><b>8:00 &nbsp;AM</b> Check-in and registration!</li>
                <li><b>8:45 &nbsp;AM</b> Opening Ceremony</li>
                <li><b>10:00 AM</b> <span class="lhdWorkshop">iOS Development with Swift and SwiftUI</span></li>
                <li><b>10:00 AM</b> <span class="lhdStudyGroup">CSE 142 Study Group</span></li>
                <li><b>11:00 AM</b> <span class="lhdWorkshop">Android Development with Java</span></li>
                <li><b>11:00 AM</b> <span class="lhdWorkshop">How to Collaborate with GitHub</span></li>
                <li><b>12:00 PM</b> Lunch Break</li>
                <li><b>1:00 &nbsp;PM</b> <span class="lhdWorkshop">Algorithms: Hack the Technical Interview</span></li>
                <li><b>1:00 &nbsp;PM</b> <span class="lhdWorkshop">Build and Deploy Node.js Apps with Microsoft Azure</span></li>
                <li><b>2:00 &nbsp;PM</b> <span class="lhdStudyGroup">CSE 143 Study Group</span></li>
                <li><b>2:00 &nbsp;PM</b> <span class="lhdWorkshop">Python: Basic Training <span class = "dash"></span> Intro to Python Skills for AI</span></li>
                <li><b>3:00 &nbsp;PM</b> <span class="lhdWorkshop">Add an FAQ Bot to Your Webpage with Microsoft Azure</span></li>
                <li><b>6:00 &nbsp;PM</b> Dinner Break</li>
                <li><b>8:00 &nbsp;PM</b> End of Hacking, Start of Demos</li>
                <li><b>8:30 &nbsp;PM</b> Awards!</li>
                <li><b>9:00 &nbsp;PM</b> Event Ends</li>
            </ul>
            <p> The schedule is not final <span class = "dash"></span> it might change before the event without prior notification.</p>
        </div>
        
        <div>
            <h2 id="faq">Frequently Asked Questions</h2>
            <ul class="qaSection">
                <li>
                    <details open>
                        <summary>
                            I have a math final on that day!
                        </summary>

                        Many students have a math midterm on December 7<sup>th</sup>! <br> <br>
                    Think of the hackathon as a way to de-stress before or after your midterm.
                    Even several of the organizers will be leaving for midterms! If you need
                    to leave early or arrive late, this is expected. Come.
                    </details>
                </li>
                <li>
                    <details open>
                        <summary>
                            Who can attend?
                        </summary>
                            You must be a current student or staff at the University of Washington.
                    </details>
                </li>
                <li>
                    <details open>
                        <summary>
                            Do I have to attend all the workshops/study groups?
                        </summary>
                            No! You can work on whatever you want, but bringing a pair of headphones with you is a good idea.
                    </details>
                </li>
                <li>
                    <details open>
                        <summary>
                            How do I win the awards?
                        </summary>
                        
                        We'll announce the award categories later, but it's as 
                        easy as showing us the project you worked on <em>during</em> this hackathon!
                    </details>
                </li>
                <li>
                    <details open>
                        <summary>
                            Will there be food?
                        </summary>
                        
                        We recommend brining your own food with you.
                    </details>
                </li>
                <li>
                    <details open>
                        <summary>
                            I have other questions...
                        </summary>

                        Check the <a href="https://localhackday.mlh.io/build/locations/2874/" target="_blank" rel="noopener noreferrer">Major League Hacking FAQ</a>,
                        or contact us through 
                        <a href="mailto:appdev@uw.edu">email</a>, <a href="https://twitter.com/uwappdev" target="_blank" rel="noopener noreferrer">twitter</a>, 
                        or <a href="https://t.me/UWAppDev" target="_blank" rel="noopener noreferrer">telegram.</a>
                    </details>
                </li>
            </ul>
        </div>
        `,
        
        "Join":
        `
            <h1>Join</h1>
            <p>Visit our Registered Student Organization Page (on the Husky Union Building's Website) to join!</p>
            
        `
    },
    
    defaultPage: "Events"
};
