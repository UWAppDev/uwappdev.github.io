"use strict";

/**
 *  A simple authentication manager.
 */
const AuthHelper = {};

AuthHelper.SIGN_IN_EVENT  = "AUTH_SIGN_IN";
AuthHelper.SIGN_OUT_EVENT = "AUTH_SIGN_OUT";
AuthHelper.AUTH_MENU_USED = "AUTH_MENU_USED";
AuthHelper.PHOTO_STORE_LOCATION = "https://firebasestorage.googleapis.com/";
AuthHelper.PROFILE_PHOTO_SIZE = 150;
AuthHelper.PHOTO_NAME_PREFIX = "_"; // Prefix all photos with this when stored on the server.
AuthHelper.PHOTO_DIR = "profile_photos";
AuthHelper.PASSWORD_REQUIREMENTS = { minLength: 14, 
                                     specialCharCount: 3,
                                     numberCharCount: 4 };

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
    signInButton.addEventListener   ("click", AuthHelper.signIn       );
    createAccount.addEventListener  ("click", AuthHelper.createAccount);
    signOutButton.addEventListener  ("click", AuthHelper.signOut      );
    accountSettings.addEventListener("click", AuthHelper.manageAccount);
    
    // Show/hide relevant commands when the user authenticates/deauthenticates.
    while (true)
    {
        await JSHelper.Notifier.waitFor(AuthHelper.SIGN_IN_EVENT);
        showRelevantCommands();
        
        await JSHelper.Notifier.waitFor(AuthHelper.SIGN_OUT_EVENT);
        showRelevantCommands();
    }
};

// Display a UI permitting the user to sign in or re-authenticate.
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
        
        // Sign in the user.
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
    
    await SubWindowHelper.alert("Signed in!", "You are signed in!");
    
    return true;
};

// Sign the user out.
AuthHelper.signOut =
async () =>
{
    JSHelper.Notifier.notify(AuthHelper.AUTH_MENU_USED);
    
    try
    {
        await firebase.auth().signOut();
        
        if (AuthHelper.isSignedIn())
        {
            throw "You seem to still be signed in. Please contact a site administrator.";
        }
    }
    catch(e)
    {
        SubWindowHelper.alert(e.code || "Error", e.message || e + "");
        
        return;
    }
    
    SubWindowHelper.alert("Signed out.", "You are now signed out.");
};

// Display UI letting users create
//an account.
AuthHelper.createAccount =
async () =>
{
    JSHelper.Notifier.notify(AuthHelper.AUTH_MENU_USED);
    
    const accountCreateWindow = SubWindowHelper.create(
    {
        title: "Create an Account",
        className: "accountWindow"
    });
    
    let contentWrapper = document.createElement("div");
    
    contentWrapper.style.display = "flex";
    contentWrapper.style.flexDirection = "column";
    contentWrapper.style.padding = "8px";
    
    let emailInput = HTMLHelper.addLabeledInput("Email Address", "", "text", contentWrapper);
    
    let passwordInput = HTMLHelper.addPasswordConcocter(contentWrapper,
                                                       AuthHelper.PASSWORD_REQUIREMENTS);
    let disclaimer = HTMLHelper.addParagraph(`Please, do <i><b>not</b></i> create an
                                              account unless explicitly told to do so
                                              by club administration. We reserve the
                                              right to delete accounts and any data
                                              associated with them. We may also share
                                              any data given to this app <span class = "dash"></span>
                                              including your name and email <span class = "dash"></span>
                                              with anyone.`, contentWrapper);
    
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

AuthHelper.photoCtx = document.createElement("canvas").getContext("2d");

// Get the SRC of the user's profile picture.
AuthHelper.getProfilePhotoSrc = 
async () =>
{
    let user = firebase.auth().currentUser;
    
    if (user.photoURL && user.photoURL.startsWith(AuthHelper.PHOTO_STORE_LOCATION)
            && user.photoURL.indexOf(" ") === -1)
    {
        return user.photoURL;
    }
    
    // Reset the canvas.
    let ctx = AuthHelper.photoCtx;
    ctx.canvas.width = AuthHelper.PROFILE_PHOTO_SIZE;
    ctx.canvas.height = AuthHelper.PROFILE_PHOTO_SIZE;
    
    // Clear it!
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Draw a background.
    ctx.fillStyle = "gray";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Draw text.
    ctx.fillStyle = "white";
    ctx.font = "12pt courier, sans";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    let outputText = (user.displayName || user.email).charAt(0).toUpperCase();
    
    ctx.fillText(outputText, ctx.canvas.width / 2, ctx.canvas.height / 2);
    
    await JSHelper.nextAnimationFrame();
    
    return ctx.canvas.toDataURL("img/png");
};

// Display account-management UI.
//Pre: The user is signed in.
AuthHelper.manageAccount = 
async () =>
{
    JSHelper.Notifier.notify(AuthHelper.AUTH_MENU_USED);
    
    // Global declaration.
    let user,
        changedProperties = {},
        accountManageWindow,
        profileImg;
    
    // Helper functions.
    // Prompt the user for a photograph to
    //be associated with their profile.
    const selectPhoto = 
    async (buttonElement) =>
    {
        let drawer = new Drawer2D(
        async (img, dataURL) =>
        {
            
            // Upload the photo to FireStore.
            let storage = await CloudHelper.awaitComponent(CloudHelper.Service.FIREBASE_STORAGE);
            let storageRef = storage.ref();
            
            let userImages = storageRef.child(AuthHelper.PHOTO_DIR);
            
            let photoFilename = AuthHelper.PHOTO_NAME_PREFIX + user.uid + ".png";
            let photo = userImages.child(photoFilename);
            
            let photoURL;
            
            try
            {
                await photo.putString(dataURL, "data_url");
                
                photoURL = await userImages.child(photoFilename).getDownloadURL();
                await user.updateProfile({ photoURL: photoURL });
            }
            catch(e)
            {
                SubWindowHelper.alert("Error " + e.code, e.message);
                
                return;
            }
            
            // Set the new photoURL.
            SubWindowHelper.alert("Done!", "Updated photograph!");
            
            // CLose the window.
            accountManageWindow.close();
        },
        {
            initialImage: profileImg,
            imageWidth: AuthHelper.PROFILE_PHOTO_SIZE,
            imageHeight: AuthHelper.PROFILE_PHOTO_SIZE
        });
    };
    
    // Handle a single option (e.g. add an input.
    //See below for usage. Data should be an array
    //of length two. The first element should be the
    //property name, the second, the input type/a button
    //command.
    const handleOption = (description, data, parent) =>
    {
        const userProperty = data[0],
              action       = data[1];
        
        if (typeof (action) === "function")
        {
            // Add a button.
            HTMLHelper.addButton(description, parent, () =>
            {
                action.call(this, this);
            });
        }
        else
        {
            // Add an input.
            HTMLHelper.addLabeledInput(description, user[userProperty], action, parent, 
            (value) =>
            {
                changedProperties[userProperty] = value;
            });
        }
    };
    
    // Define state.
    user = firebase.auth().currentUser;
    
    // Request things of the user, if necessary.
    if (!user.emailVerified)
    {
        try
        {
            await user.sendEmailVerification();
        }
        catch(e)
        {
            await SubWindowHelper.alert("Error " + e.code, e.message);
            
            return;
        }
        
        SubWindowHelper.alert("Email Verification", 
        `
            <p>It looks like you haven't verified your email.
            We've sent you another verification request.
            If you are unable to find this request, please check
            your junk and spam folders.</p>
            <p>Your email is currently listed as ${user.email}.
            If this is in error, please correct it using menus under
            &ldquo;Secured Settings&rdquo;.
        `, undefined, true); // No onclose, but use html.
    }
    
    const singleAuthManaged =
    {
        "Name": ["displayName", "text"],
        "Change Photo": ["photoURL",   selectPhoto]
    };
    
    // Create the window.
    accountManageWindow = SubWindowHelper.create(
    {
        title: "Manage Account",
        className: "accountWindow"
    });
    
    accountManageWindow.enableFlex("column");
    
    
    profileImg = new Image();
    profileImg.crossOrigin = "Anonymous";
    profileImg.setAttribute("title", "Profile Image");
    
    let resetCircle = (waitTime) =>
    {
        // But do it after the display has had time to update.
        setTimeout(() => { accountManageWindow.updateResizeCircleLocation(true); }, waitTime || 200);
    };
    
    // Reset the resize circle's position.
    // TODO Make this better!
    profileImg.addEventListener("load", resetCircle);
    
    // Reset the circle two seconds after load.
    resetCircle(2000);
    
    profileImg.src = await AuthHelper.getProfilePhotoSrc();
    profileImg.classList.add("profilePhoto");
    
    // Add the user's profile photo.
    accountManageWindow.appendChild(profileImg);
    
    for (let description in singleAuthManaged)
    {
        handleOption(description, singleAuthManaged[description], accountManageWindow);
    }
    
    // Add the submit button.
    HTMLHelper.addButton("Submit", accountManageWindow, 
    async () =>
    {
        try
        {
            await user.updateProfile(changedProperties);
        }
        catch(error)
        {
            SubWindowHelper.alert(error.code, error.message);
            
            return;
        }
        
        accountManageWindow.close();
    });
    
    // Add any double-auth managed state.
    HTMLHelper.addButton("Secured Settings", accountManageWindow,
    async () =>
    {
        await AuthHelper.manageSecureSettings();
        accountManageWindow.close();
    });
};

// Delete all data associated with a user.
AuthHelper.deleteUserData = 
async () =>
{
    // Delete files (for now, just the profile photo).
    const user = firebase.auth().currentUser;
    
    let storage = await CloudHelper.awaitComponent(CloudHelper.Service.FIREBASE_STORAGE);
    let storageRef = storage.ref();
    
    let userImages = storageRef.child(AuthHelper.PHOTO_DIR);
    
    let photoFilename = AuthHelper.PHOTO_NAME_PREFIX + user.uid + ".png";
    let photo = userImages.child(photoFilename);
    
    //await photo.delete();
    
    // Delete user data.
    let database = await CloudHelper.awaitComponent(CloudHelper.Service.FIRESTORE);
    
    let userContent = await database.collection("userData").doc(user.uid).get();
    
    if (userContent.exists)
    {
        await database.collection("userData").doc(user.uid).delete();
    }
};

// Manage secured settings -- open a GUI for
//changing password/email/deleting account.
AuthHelper.manageSecureSettings = 
async () =>
{
    // Re-authenticate the user.
    let signInResult = await AuthHelper.signIn();
    
    if (!signInResult)
    {
        return false;
    }
    
    // Create a window with secured settings.
    const accountManageWindow = SubWindowHelper.create(
    {
        title: "Manage Account (Secured Settings)",
        className: "accountWindowSecuredSettings"
    });
    
    // Get the user.
    const user = firebase.auth().currentUser;
    
    // Enable flexible-box
    accountManageWindow.enableFlex("column");
    
    HTMLHelper.addButton("Change Email Address", accountManageWindow,
    async () =>
    {
        accountManageWindow.close();
        
        let emails = {};
        
        do
        {
            emails = await SubWindowHelper.prompt("New Email Address", 
                "Enter and confirm the new email address.",
                { "Email": "text", "Confirm Email": "text" });
        }
        while (emails.Email !== emails["Confirm Email"]);
        
        // Update it!
        try
        {
            await user.updateEmail(emails.Email);
            await user.sendEmailVerification();
        }
        catch(error)
        {
            SubWindowHelper.alert(error.code, error.message);
            return;
        }
        
        SubWindowHelper.alert("Email Address Changed", "Your email address has been changed. Please, verify the new address.");
    });
    
    HTMLHelper.addButton("Change Password", accountManageWindow,
    async () =>
    {
        accountManageWindow.close();
        
        let submitButton;
        
        const passwordChangeWindow = SubWindowHelper.create(
        {
            title: "Change Password",
            className: "accountWindow"
        });
        
        
        HTMLHelper.addLabel("Enter a new password: ", passwordChangeWindow);
        
        const passwordCreator = HTMLHelper.addPasswordConcocter(passwordChangeWindow,
                                                       AuthHelper.PASSWORD_REQUIREMENTS);
        
        submitButton = HTMLHelper.addButton("Submit", passwordChangeWindow, 
        async () =>
        {
            const password = passwordCreator.get();
            
            try
            {
                await user.updatePassword(password);
            }
            catch(error)
            {
                SubWindowHelper.alert(error.message, error.code);
                
                return;
            }
            
            SubWindowHelper.alert("Updated password!", "Your password has been updated.");
            
            passwordChangeWindow.close();
        });
        
        // TODO This looks like duplicated code...
        //      How might this be fixed?
        submitButton.style.height = "0em";
        submitButton.style.transition = "0.4s ease all";
        submitButton.style.overflow = "hidden";
        
        passwordCreator.onValid(() =>
        {
            submitButton.style.height = "1.5em";
        });
        
        passwordCreator.onInvalid(() =>
        {
            submitButton.style.height = "0em";
        });
    });
    
    HTMLHelper.addButton("Delete Account", accountManageWindow,
    async () =>
    {
        const doDelete = await SubWindowHelper.confirm("Confirm Deletion", "Really delete account?", "Yes", "No");
        
        if (!doDelete)
        {
            return;
        }
        
        accountManageWindow.close();
        
        try
        {
            await AuthHelper.deleteUserData();
            await user.delete();
            
            await SubWindowHelper.alert("Deletion", "Account deleted.");
        }
        catch(e)
        {
            await SubWindowHelper.alert("Error: " + e.code, e.message);
        }
    });
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
