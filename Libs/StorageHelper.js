"use strict";

/**
 *  A simple storage manager, permitting storage and automatic deletion of
 * data. It is intended to use window.localStorage.
 */
const StorageHelper = {};

StorageHelper.DEFAULT_STORE_DURATION = 12; // Default to this number of days until expiration.
StorageHelper.STORAGE_PREFIX         = "_S"; // A string with which to prefix all items belonging to
                                            //storageHelper.

/**
 *  Store data with a given expiration time in milliseconds since 1970. This time
 * defaults to DEFAULT_STORE_DURATION days. The
 * given data should be serializable.
 */
StorageHelper.put = (key, data, expiration) =>
{
    expiration = expiration || ((new Date()).getTime() + 1000 * 60 * 60 * 24
                                           * StorageHelper.DEFAULT_STORE_DURATION); // Default
                                                                                    // storage 
                                                                                    //duration.
    let nowTime = (new Date()).getTime();

    // Only proceed if the data won't immediately expire.
    if (expiration < nowTime)
    {
        return;
    }
    
    let saveData = StorageHelper.STORAGE_PREFIX + nowTime + "/" + expiration + "?" + SerializationHelper.stringSerialize(data);
    
    console.warn(saveData);
    
    if (window.localStorage)
    {
        window.localStorage.setItem(key, saveData);
    }
    else
    {
        console.error("LOCAL STORAGE IS INACCESSABLE");
    }
};

/**
 *  Get data from the store. Returns undefined if no such data exists.
 */
StorageHelper.get = (key) =>
{
    if (window.localStorage)
    {
        const itemDetails = StorageHelper.getItemDetails(key);
        
        try
        {
            // Eval is evil, but we know WE set the localStorage cookies.
            return SerializationHelper.evalParseFromString(itemDetails.content);
        }
        catch(e)
        {
            // Malformed?
            console.warn(key + " has malformed data. Error: " + e);
            console.warn("Content of " + key + " has been stored in");
            console.warn("window.debugStr for debugging purposes.");
            console.warn("The invalid entry will now be deleted.");
            
            window.debugStr = itemDetails.content;
            
            // Delete it.
            StorageHelper.delete(key);
            
            return null;
        }
    }
    
    return undefined;
};

/**
 * Delete an item in the store.
 */
StorageHelper.delete = (key) =>
{
    if (window.localStorage
        && StorageHelper.has(key))
    {
        window.localStorage.removeItem(key);
        
        return true;
    }
    
    return false;
};

/**
 * Get whether an object is stored!
 */
StorageHelper.has = (key) =>
{
    if (window.localStorage)
    {
        return window.localStorage.getItem(key) !== null;
    }
    
    return false;
};

// Get the details of an item in the format:
// { created: time in ms, expires: time in ms, 
//   content: text, malformed: boolean }.
StorageHelper.getItemDetails = (itemKey) =>
{
    if (window.localStorage)
    {
        const fullData = window.localStorage.getItem(itemKey) || "";
                
        const recordTimeEndIndex = fullData.indexOf("/"),
              expireTimeEndIndex = fullData.indexOf("?");
        
        
        if (!fullData.startsWith(StorageHelper.STORAGE_PREFIX)
            || recordTimeEndIndex == -1 || expireTimeEndIndex < recordTimeEndIndex)
        {
            return { malformed: true };
        }
        
        const createTime = MathHelper.forceParseInt(
                            fullData.substring(StorageHelper.STORAGE_PREFIX.length,
                                              recordTimeEndIndex)),
              expireTime = MathHelper.forceParseInt(
                            fullData.substring(recordTimeEndIndex + 1, expireTimeEndIndex)),
              content    =  fullData.substring(expireTimeEndIndex + 1);
       
        
       
        const result = 
        {
            created: createTime,
            expires: expireTime,
            content: content,
            malformed: false
        };
        
        return result;
    }
    else
    {
        const result = {};
        
        return result;
    }
};

// Remove all expired items belonging to the storage helper.
StorageHelper.removeExpired = () =>
{
    const nowTime = (new Date()).getTime();

    if (window.localStorage)
    {
        const getExpTime = (itemKey) =>
        {
            const expTime = StorageHelper.getItemDetails(itemKey).expires;
                                
            if (expTime !== NaN && expTime !== undefined)
            {
                console.log(itemKey + " expires in " + Math.floor((expTime - (new Date()).getTime()) / 60 / 60 / 24 / 1000) 
                        + " day(s).");
            }
                    
            return expTime;                                      
        };
    
        let expTime;
    
        for (let key in window.localStorage)
        {
            expTime = getExpTime(key);
            
            if (expTime !== undefined && expTime !== NaN && expTime < nowTime)
            {
                window.localStorage.removeItem(key);
            }
        }
    }
};

// On page load, remove expired elements.
requestAnimationFrame(StorageHelper.removeExpired);
