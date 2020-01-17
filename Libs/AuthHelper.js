"use strict";

/**
 *  A simple authentication manager.
 */
const AuthHelper = {};

AuthHelper.SIGN_IN_EVENT  = "AUTH_SIGN_IN";
AuthHelper.SIGN_OUT_EVENT = "AUTH_SIGN_OUT";
AuthHelper.AUTH_MENU_USED = "AUTH_MENU_USED";

// Add buttons for managing authentication
//to the element, parent. Actions are completed
//in SubWindows.
AuthHelper.insertAuthCommands = 
async (parent) =>
{
    let signedOutDisplay = document.createElement("div");
    let signedInDisplay = document.createElement("div");
    
    let signInButton = HTMLHelper.addButton("Sign In", signedOutDisplay),
        signOutButton = HTMLHelper.addButton("Sign Out", signedInDisplay),
        accountSettings = HTMLHelper.addButton("Account", signedInDisplay),
        createAccount   = HTMLHelper.addButton("Create Account", signedOutDisplay);
    
    signedOutDisplay.classList.add("authCommands");
    signedInDisplay.classList.add("authCommands");
    
    // Shows commands relevant to the user's current sign-in
    //state.
    const showRelevantCommands = () =>
    {
        if (!AuthHelper.isSignedIn())
        {
            signedInDisplay.style.display = "none";
            signedOutDisplay.style.display = "flex";
        }
        else
        {
            signedInDisplay.style.display = "flex";
            signedOutDisplay.style.display = "none";
        }
    };
    
    // Show only commands relevant to the user's current
    //sign-in state.
    showRelevantCommands();
    
    // Add both displays
    parent.appendChild(signedOutDisplay);
    parent.appendChild(signedInDisplay);
    
    // Handle events.
    signInButton.addEventListener       ("click", AuthHelper.signIn       );
    createAccount.addEventListener      ("click", AuthHelper.createAccount);
    
    while (true)
    {
        await JSHelper.Notifier.waitFor(AuthHelper.SIGN_IN_EVENT);
        showRelevantCommands();
        
        await JSHelper.Notifier.waitFor(AuthHelper.SIGN_OUT_EVENT);
        showRelevantCommands();
    }
};

// Display a UI permitting the user to sign in.
AuthHelper.signIn = 
async () =>
{
    JSHelper.Notifier.notify(AuthHelper.AUTH_MENU_USED);
    
    let response = 
    await SubWindowHelper.prompt("Sign In", 
            "Please, enter your email/username and password.",
            { "Email": "text", "Password": "password" });
    
    const email = response.Email;
    
    // Sign the user in.
    try
    {
        const password = response.Password;
        
        await window.firebase.auth().signInWithEmailAndPassword
                                        (email, password);
    }
    catch(error)
    {
        const errorCode = error.code;
        const errorMessage = error.message;
        
        // Inform the user of the error.
        const resetPassword = await SubWindowHelper.confirm("Error " + errorCode, errorMessage + " Send a password reset email?", "Yes", "No");
        
        if (resetPassword)
        {
            try
            {
                await firebase.auth().sendPasswordResetEmail(email);
            }
            catch (error)
            {
                SubWindowHelper.alert(error.code, error.message);
            }
        }
        
        return;
    }
    
    SubWindowHelper.alert("Signed in!", "You are signed in!");
};

// Display UI letting users create
//an account.
AuthHelper.createAccount =
async () =>
{
    const accountCreateWindow = SubWindowHelper.create(
    {
        title: "Create an Account",
        className: "signInWindow"
    });
    
    let contentWrapper = document.createElement("div");
    
    contentWrapper.style.display = "flex";
    contentWrapper.style.flexDirection = "column";
    contentWrapper.style.padding = "8px";
    
    let emailInput = HTMLHelper.addLabeledInput("Email Address", "", "text", contentWrapper);
    
    let passwordInput = HTMLHelper.addPasswordConcocter(contentWrapper,
                                                       { minLength: 13, 
                                                          specialCharCount: 3,
                                                          numberCharCount: 4 });
    let disclaimer = HTMLHelper.addParagraph(`Please, do <i><b>not</b></i> create an
                                              account unless explicitly told to do so
                                              by club administration. We reserve the
                                              right to delete accounts and any data
                                              associated with them.`, contentWrapper);
    
    let submitButton = HTMLHelper.addButton("Sumbit", contentWrapper);
    
    submitButton.style.transition = "0.4s ease all";
    submitButton.style.overflow = "hidden";
    submitButton.style.height = "0em";
    
    passwordInput.onValid(() =>
    {
        submitButton.style.height = "1.5em";
    });
    
    passwordInput.onInvalid(() =>
    {
        submitButton.style.height = "0em";
    });
    
    // Minor styling.
    contentWrapper.style.maxWidth = "500px";
    contentWrapper.style.marginLeft = "auto";
    contentWrapper.style.marginRight = "auto";
    
    // Create the account!
    submitButton.addEventListener("click", 
    async () =>
    {
        const email    = emailInput.value;
        const password = passwordInput.get();
        
        try
        {
            await firebase.auth().createUserWithEmailAndPassword(email, password);
        }
        catch(error)
        {
            SubWindowHelper.alert("Error: " + error.code, error.message);
            
            return;
        }
        
        accountCreateWindow.close();
        
        let user = firebase.auth().currentUser;
        
        if (user)
        {
            try
            {
                await user.sendEmailVerification();
            }
            catch(e)
            {
                SubWindowHelper.alert("Error: " + error.code, error.message);
                
                return;
            }
        }
        else
        {
            console.error("User == null.");
        }
        
        await SubWindowHelper.alert("Success!", "Please, sign in and check your email.");
    });
    
    accountCreateWindow.appendChild(contentWrapper);
};

AuthHelper.isSignedIn = () =>
{
    return AuthHelper.user != undefined;
};

// Initialize on page load.
requestAnimationFrame(
async () =>
{
    await JSHelper.Notifier.waitFor(JSHelper.PAGE_SETUP_COMPLETE, true);
    
    // Only attempt to manage authentication if firebase is defined.
    if (window.firebase)
    {
        window.firebase.auth().onAuthStateChanged((user) =>
        {
            if (user) // User is defined when signed in.
            {
                JSHelper.Notifier.notify(AuthHelper.SIGN_IN_EVENT, user);
            } // Otherwise, the user is signed out.
            else
            {
                JSHelper.Notifier.notify(AuthHelper.SIGN_OUT_EVENT);
            }
            
            // Store the user.
            AuthHelper.user = user;
        });
    }
});
