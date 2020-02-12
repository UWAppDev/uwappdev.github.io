"use strict";

/**
 *  Wraps communication with a cloud service (probably firebase)
 * and permits global access and management.
 */

const CloudHelper = {};

// An enum of supported services that can be wrapped by
//CloudHelper.
CloudHelper.Service = 
{
    FIRESTORE: 1,
    FIREBASE_STORAGE: 2
};

// A prefix used for notifications involving the availablity of services.
CloudHelper.SERVICE_NOTIFY_PREFIX = "CloudHelperService";

// Data specific to services like Firestore.
CloudHelper.ServiceData = 
{
    Firebase: 
    {
        initApp: (firebase, apiData) =>
        {
            const localData = CloudHelper.ServiceData.Firebase;
            
            // Have we initialized the app?
            if (!localData.firebase)
            {
                // If not, do so.
                localData.firebase = firebase;
                firebase.initializeApp(apiData);
            }
        }
    }
};

// A map database modules.
CloudHelper.WrappedDBs = 
{
    
};

// The name of the primary database.
CloudHelper.PRIMARY_DB_NAME = "primary";

// Initialize a database
//with given API data. Options.apiData should
//contain data used for authentication.
//Options.resources should be an array of CloudHelper.Service
//modules to load.
//Ref: firebase.google.com/docs/firestore/quickstart?authuser=1
CloudHelper.initDB = (database, options) =>
{
    if (!database)
    {
        console.warn("Unable to access database (CloudHelper.initDB). Exiting early.");
        
        return;
    }
    
    options = options || {};
    
    options.dbName = options.dbName || CloudHelper.PRIMARY_DB_NAME;
    
    const firebaseApp = options.resources.includes(CloudHelper.Service.FIRESTORE)
                        || options.resources.includes(CloudHelper.Service.FIREBASE_STORAGE);
    
    if (firebaseApp)
    {
        // Initialize the app if this has not yet been done.
        CloudHelper.ServiceData.Firebase.initApp(database, options.apiData);
    }
    
    // Switch on the type of each service.
    for (let i = 0; i < options.resources.length; i++)
    {
        // Any data passed along to listeners.
        let relevantData = undefined;
        
        switch (options.resources[i])
        {
            case CloudHelper.Service.FIRESTORE:
                // Have we already initialized this service?
                if (!CloudHelper.ServiceData.Firestore)
                {
                    CloudHelper.ServiceData.Firestore = {};
                    
                    let firestoreData = CloudHelper.ServiceData.Firestore;
                    
                    // Initialize the database.
                    firestoreData.db = database.firestore();
                    
                    // Set the primary database.
                    CloudHelper.WrappedDBs[options.dbName] 
                        = new CloudHelper.FirestoreWrappedDB(firestoreData.db);
                        
                    // Pass the database to listeners.
                    relevantData = firestoreData.db;
                }
                break;
            case CloudHelper.Service.FIREBASE_STORAGE:
                if (!CloudHelper.ServiceData.FirebaseStorage)
                {
                    CloudHelper.ServiceData.FirebaseStorage = {};
                    
                    let storageData = CloudHelper.ServiceData.FirebaseStorage;
                    
                    // Get a reference to the service.
                    storageData.storage = database.storage();
                    
                    // Pass it to listeners.
                    relevantData = storageData.storage;
                }
                break;
            default:
                console.error("Unknown service given to initDB: " + options.resources[i]);
        }
        
        JSHelper.Notifier.notify(CloudHelper.SERVICE_NOTIFY_PREFIX + options.resources[i], relevantData);
    }
};

// Wait for a component in the CloudHelper.Service
//enum.
CloudHelper.awaitComponent = (componentEnumVal) =>
{
    return JSHelper.Notifier.waitFor(CloudHelper.SERVICE_NOTIFY_PREFIX + componentEnumVal, true);
};

// TODO: Finish implementing wrappers.
// TODO: Do we even <i>need</i> this? I think it should just
// be gotten rid of.

// The base class of all database wrappers.
CloudHelper.BaseWrappedDB = function()
{
    this.sub = JSHelper.NotImplemented("string : name", "Get a sub-category of the database.", "-> data/WrappedDB");
    this.get = JSHelper.NotImplemented("string : childName", "Get the value of this node of the database or, if specified, that of childName.", "-> promise-like object");
    this.set = JSHelper.NotImplemented("string : childName", "Set a child's value.");
};

// A wrapper around the Firebase Firestore database.
CloudHelper.FirestoreWrappedDB = function(db)
{
    const me = this;

    CloudHelper.BaseWrappedDB.apply(me);

    me.db = db;

    this.sub = function(key)
    {
        let subcollections = me.db.getCollections();

        if (subcollections.includes(key))
        {
            return new CloudHelper.FirestoreWrappedDB(me.db.collection(key));
        }
        else
        {
            return new CloudHelper.FirestoreWrappedDoc(me.db.doc(key));
        }
    };
    
    this.get = function(key)
    {
        
    };
};

// A wrapper around the Firestore document element.
CloudHelper.FirestoreWrappedDoc = function(doc)
{
    const me = this;

    CloudHelper.BaseWrappedDB.apply(me);

    me.doc = doc;

    this.get = function()
    {
        return me.doc.get();
    };

    this.set = function(data)
    {
        me.doc.set(data);
    };
};
