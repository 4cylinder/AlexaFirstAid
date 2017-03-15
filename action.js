/**
 * CS260A PROG 02
 * First Aid voice app using Alexa
 * T.S. (Tzuo Shuin) Yew
 */

'use strict';

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
// NOTE: This function is copied from the Reindeer Games example tutorial.
exports.handler = function (event, context) {
    try {
        console.log("event.session.application.applicationId=" + event.session.application.applicationId);

        if (event.session.application.applicationId !== "amzn1.ask.skill.5614d261-6923-4e0f-b0d2-c17781dd7fde") {
            context.fail("Invalid Application ID");
        }

        if (event.session.new) {
            onSessionStarted({requestId: event.request.requestId}, event.session);
        }

        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "IntentRequest") {
            onIntent(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "SessionEndedRequest") {
            onSessionEnded(event.request, event.session);
            context.succeed();
        }
    } catch (e) {
        context.fail("Exception: " + e);
    }
};

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId + ", sessionId=" + session.sessionId);

    // add any session init logic here
}

/**
 * Called when the user invokes the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log("onLaunch requestId=" + launchRequest.requestId + ", sessionId=" + session.sessionId);

    getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log("onIntent requestId=" + intentRequest.requestId + ", sessionId=" + session.sessionId);

    var intent = intentRequest.intent, intentName = intentRequest.intent.name;
    console.log("the current intent is "+intentName);

    // handle yes/no intent after the user has been prompted
    if (session.attributes && session.attributes.userPromptedToContinue) {
        delete session.attributes.userPromptedToContinue;
        if ("AMAZON.NoIntent" === intentName) {
            handleFinishSessionRequest(intent, session, callback);
        } else if ("AMAZON.YesIntent" === intentName) {
            handleRepeatRequest(intent, session, callback);
        }
    }

    // dispatch custom intents to handlers here
    if ("SelectItemIntent" === intentName) {
        handleSelectItemRequest(intent, session, callback);
    } else if ("UnsureIntent" === intentName) {
        handleGetHelpRequest(intent, session, callback);
    } else if ("CprReadyIntent" === intentName) {
        handleCprReadyRequest(intent, session, callback);
    } else if ("CprUnsureIntent" === intentName) {
        handleCprUnsureRequest(intent, session, callback);
    } else if ("CprRestartIntent" === intentName) {
        handleCprRestartRequest(intent, session, callback);
    } else if ("CprDoneIntent" === intentName) {
        handleCprDoneRequest(intent, session, callback);
    } else if ("CprQuitIntent" === intentName) {
        handleCprQuitRequest(intent, session, callback);
    } else if ("CprQuitConfirmIntent" === intentName) {
        handleCprQuitConfirmRequest(intent, session, callback);
    } else if ("CprQuitCancelIntent" === intentName) {
        handleCprQuitCancelRequest(intent, session, callback);
    } else if ("AMAZON.StartOverIntent" === intentName) {
        getWelcomeResponse(callback);
    } else if ("AMAZON.RepeatIntent" === intentName) {
        handleRepeatRequest(intent, session, callback);
    } else if ("AMAZON.HelpIntent" === intentName) {
        handleGetHelpRequest(intent, session, callback);
    } else if ("AMAZON.StopIntent" === intentName) {
        handleFinishSessionRequest(intent, session, callback);
    } else if ("AMAZON.CancelIntent" === intentName) {
        handleFinishSessionRequest(intent, session, callback);
    } else {
        throw "Invalid intent";
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId + ", sessionId=" + session.sessionId);

    // Add any cleanup logic here
}

// ------- Skill specific business logic -------
var CARD_TITLE = "First Aid";

function getWelcomeResponse(callback) {
    console.log("Welcome Response triggered.");
    var sessionAttributes = {};
    var speechOutput = "First Aid here, what can I help you with?";
    var shouldEndSession = false;
    var cprInProgress = false;
    var currentCprStep = -1;
    var chokeCheck = false;
    var cprCycles = 0;
    var repromptText = "Please state the nature of the emergency.";

    speechOutput += repromptText;
    sessionAttributes = {
        "speechOutput": repromptText,
        "repromptText": repromptText,
        "cprInProgress": cprInProgress,
        "currentCprStep": currentCprStep,
        "chokeCheck": chokeCheck,
        "cprCycles": cprCycles
    };
    callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

// when user replies "someone is injured, they're bleeding, etc"
function handleSelectItemRequest(intent, session, callback){
    var item = intent.slots.Item.value;
    console.log("Emergency item selected was "+item);
    var speechOutput = "";
    var repromptText;
    var cprInProgress = session.attributes.cprInProgress;
    var chokeCheck = session.attributes.chokeCheck;
    var currentCprStep = session.attributes.currentCprStep;
    var cprCycles = session.attributes.cprCycles;
    var sessionAttributes = {};

    if (cprInProgress) { // Is a CPR session in progress?
        console.log("CPR session in progress while attempting to select item")
        sessionAttributes.userPromptedToContinue = true;
        speechOutput = "There is a CPR procedure in progress. Do you want to start over? ";
        callback(sessionAttributes,
            buildSpeechletResponse(CARD_TITLE, speechOutput, speechOutput, false));
    } else if (!isRequestValid(intent)) { // Is the request invalid?
        console.log("invalid request");
        var reprompt = session.attributes.speechOutput;
        var speechOutput = "We don't recognize your emergency. Please try again or call nine one one."
        callback(session.attributes,
            buildSpeechletResponse(CARD_TITLE, speechOutput, reprompt, false));
    } else if (item=="CPR"){
        speechOutput = "Initializing CPR session. Lay the person on a firm, flat surface.";
        speechOutput += " When you are ready to begin, say ready.";
        repromptText = "When you are ready to begin, say ready.";
        cprInProgress = true;
        currentCprStep = 0;
    } else if (item=="choking") { // Is this a choking prompt?
        speechOutput += "Is the person unconscious or conscious?";
        repromptText = "Say conscious or unconscious";
        chokeCheck = true;
    } else {
        var response;
        if (chokeCheck==true && (item=="conscious" || item=="unconscious")) {
            chokeCheck = false;
            response = firstAid(item+" choking");    
        }
        else {
            response = firstAid(item);
        }
        if (response.length==1){
        	speechOutput += response[0] + " ";
        } else {
	        for (var i=0; i<response.length; i++){
	            speechOutput += "Step " + (i+1);
	            speechOutput += ": "+response[i]+ " ";
	        }
        }
        
        repromptText = speechOutput;
    }
    sessionAttributes = {
        "speechOutput": repromptText,
        "repromptText": repromptText,
        "cprInProgress": cprInProgress,
        "currentCprStep": currentCprStep,
        "chokeCheck": chokeCheck,
        "cprCycles": cprCycles
    };
    callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, false));
}

// Helper function
function firstAid(emergency) {
    var response = [];
    switch (emergency){  
        case "injured":
        case "injury":
        case "checking an injured adult":
            response.push("Tap the shoulder of the person and shout Are you OK.");
            response.push("Roll the person face up, supporting the head, neck, and back in a straight line.");
            response.push("Call nine one one.");
            response.push("Open the airway by tilting the head and lifting the chin.");
            response.push("Check for breathing for no more than ten seconds. Occasional gasps are not breathing.");
            response.push("Quickly scan for severe bleeding.");
            break;
        case "bleeding":
        case "controlling bleeding":
            response.push("Cover the wound.");
            response.push("Apply direct pressure until bleeding stops.");
            response.push("Cover the dressing with a bandage.");
            response.push("Apply more pressure and call nine one one.");
            break;
        case "conscious choking":
            response.push("Bend the person forward at the waist.");
            response.push("Hit the person five times between the shoulder blades with the heel of one hand.");
            response.push("Place a fist with the thumb against the middle of the person's abdomen above the navel.");
            response.push("Cover your fist with your other hand.");
            response.push("Give five quick upward abdominal thrusts.");
            response.push("Call nine one one.");
            break;
        case "unconscious choking":
            response.push("Retilt the person's head and give rescue breaths.");
            response.push("If the chest does not rise, Give thirty chest compressions.");
            response.push("Look for and remove any visible objects from the mouth.");
            response.push("Give two rescue breaths.");
            response.push("Repeat steps two to four if the chest still does not rise. Otherwise, check for breathing.");
            response.push("Call nine one one.");
            break;
        case "AED":
            response.push("Turn on the AED");
            response.push("Wipe the bare chest dry.");
            response.push("Attach the pads and plug in the connector if necessary.");
            response.push("Stand clear");
            response.push("Analyze the heart rhythm");
            response.push("Deliver the shock.");
            response.push("Perform CPR. If you need help, say Alexa I need help with CPR.");
            response.push("Call nine one one.");
            break;
        case "burns":
        case "burned":
            response.push("Remove the source of the burn.");
            response.push("Cool the burn with cold running water.");
            response.push("Cover the burn loosely with sterile dressing.");
            response.push("Call nine one one.");
            response.push("Care for shock.");
            break;
        case "poisoned":
        case "poisoning":
            response.push("Call nine one one or the poison control hotline.");
            response.push("Isolate and contain the poison source if possible.");
            response.push("Provide care for the person.");
            break;
        case "neck injury":
        case "injured neck":
        case "neck injuries":
        case "spinal injury":
        case "spinal injuries":
        case "injured spine":
            response.push("Call nine one one.");
            response.push("Minimize movement of the head, neck, and spine.");
            response.push("Place both hands on both sides of the person's head for stability.");
            break;
        case "stroke":
            response.push("Call nine one one.");
            response.push("Check the scene and the injured person.");
            response.push("Ask the person to smile and check for droops in the face.");
            response.push("Ask the person to raise both arms and check for any downward drift.");
            response.push("Ask the person to repeat a simple sentence and check for slur.");
            break;
        default:
            response.push("Call nine one one.");
            break;
    }
    return response;
}

// This array stores the CPR steps if a CPR session is in progress
var CPRsteps = [
    "thirty chest compressions.",
    "two rescue breaths.",
];

function handleCprReadyRequest(intent, session, callback){
    console.log("CPR ready request");
    
    var speechOutput = "";
    var repromptText;
    var cprInProgress = session.attributes.cprInProgress;
    var chokeCheck = session.attributes.chokeCheck;
    var currentCprStep = session.attributes.currentCprStep;
    var cprCycles = session.attributes.cprCycles;
    var sessionAttributes = {};

    if (!cprInProgress) {
        speechOutput += "Are you trying to start a CPR request? If so, say I need help with CPR.";
        repromptText = "Say I need help with CPR";
    } else {
        if (cprCycles<1) {
            if (currentCprStep==0) {
                speechOutput += " Push hard, push fast in the middle of the chest ";
                speechOutput += "at least 2 inches deep and at least 100 compressions per minute.";
            } else {
                speechOutput += "Tilt the head back and lift the chin up. Pinch the nose shut then make";
                speechOutput += " a complete seal over the mouth. Blow in for 1 second to make the chest clearly rise.";
                speechOutput += " Give rescue breaths, one after the other.";
            }
        }
        
    }
    speechOutput += " When you are ready to move on, say done."
    repromptText = speechOutput;
    sessionAttributes = {
        "speechOutput": speechOutput,
        "repromptText": repromptText,
        "cprInProgress": cprInProgress,
        "currentCprStep": currentCprStep,
        "chokeCheck": chokeCheck,
        "cprCycles": cprCycles
    };
    callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, false));
}

function handleCprDoneRequest(intent, session, callback){
    console.log("CPR done request");

    var speechOutput = "";
    var repromptText;
    var cprInProgress = session.attributes.cprInProgress;
    var chokeCheck = session.attributes.chokeCheck;
    var currentCprStep = session.attributes.currentCprStep;
    var cprCycles = session.attributes.cprCycles;
    var sessionAttributes = {};

    if (!cprInProgress) {
        speechOutput += "Are you trying to start a CPR request? If so, say I need help with CPR.";
        repromptText = "Say I need help with CPR";
    } else {
        if (currentCprStep==0) {
            currentCprStep++;
        } else {
            currentCprStep = 0;
            cprCycles++;
        }

        speechOutput += "The next step is " +  CPRsteps[currentCprStep];
        speechOutput += ". When ready, say ready. ";      
        repromptText = speechOutput;
    }

    sessionAttributes = {
        "speechOutput": speechOutput,
        "repromptText": repromptText,
        "cprInProgress": cprInProgress,
        "currentCprStep": currentCprStep,
        "chokeCheck": chokeCheck,
        "cprCycles": cprCycles
    };
    callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, false));
}

function handleCprRestartRequest(intent, session, callback){
    var sessionAttributes = {};
    sessionAttributes = {
        "speechOutput": "Restarting your CPR session. Say ready when ready.",
        "repromptText": "Your CPR session is restarted. Say ready when ready.",
        "cprInProgress": true,
        "currentCprStep": 0,
        "chokeCheck": false,
        "cprCycles": 0
    };
    callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, false));
}

function handleCprQuitRequest(intent, session, callback){
    console.log("quit cpr");
    var speechOutput = "";
    var repromptText;
    var cprInProgress = session.attributes.cprInProgress;
    var chokeCheck = session.attributes.chokeCheck;
    var currentCprStep = session.attributes.currentCprStep;
    var cprCycles = session.attributes.cprCycles;
    var sessionAttributes = {};

    if (!cprInProgress) {
        speechOutput = "You don't have a CPR session running. Do you have an emergency to report?";
        repromptText = speechOutput;
    } else {
        speechOutput = "Are you sure you want to stop?";
        repromptText = speechOutput;
    }
    sessionAttributes = {
        "speechOutput": speechOutput,
        "repromptText": repromptText,
        "cprInProgress": cprInProgress,
        "currentCprStep": currentCprStep,
        "chokeCheck": chokeCheck,
        "cprCycles": cprCycles,
        "cprQuitIntent": true
    };
    callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, false));
}

function handleCprQuitConfirmRequest(intent, session, callback){
    console.log("confirm quit cpr");
    var speechOutput = "";
    var repromptText;
    var sessionAttributes = {};
    var cprInProgress = session.attributes.cprInProgress;
    var cprQuitIntent = session.attributes.cprQuitIntent;

    if (!cprInProgress || !cprQuitIntent) {
        handleGetHelpRequest(intent, session, callback);
    } else {
        speechOutput = "Your CPR session is now over.";
    }
    repromptText = speechOutput;
    sessionAttributes = {
        "speechOutput": speechOutput,
        "repromptText": repromptText,
        "cprInProgress": false,
        "currentCprStep": -1,
        "chokeCheck": false,
        "cprCycles": 0,
        "cprQuitIntent": false
    };
    callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, false));
}

function handleCprQuitCancelRequest(intent, session, callback){
    console.log("quit cpr");
    var speechOutput = "";
    var repromptText;
    var cprInProgress = session.attributes.cprInProgress;
    var cprQuitIntent = session.attributes.cprQuitIntent;
    var chokeCheck = session.attributes.chokeCheck;
    var currentCprStep = session.attributes.currentCprStep;
    var cprCycles = session.attributes.cprCycles;
    var sessionAttributes = {};

    if (!cprInProgress || !cprQuitIntent) {
        handleGetHelpRequest(intent, session, callback);
    } else {
        speechOutput = "Resuming your CPR session.";
    }

    repromptText = speechOutput;
    sessionAttributes = {
        "speechOutput": speechOutput,
        "repromptText": repromptText,
        "cprInProgress": true,
        "currentCprStep": currentCprStep,
        "chokeCheck": chokeCheck,
        "cprCycles": cprCycles,
        "cprQuitIntent": false
    };
    callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, false));
}

function handleRepeatRequest(intent, session, callback) {
    // Repeat the previous speechOutput and repromptText from the session attributes if available
    // else start a new first aid session
    if (!session.attributes || !session.attributes.speechOutput) {
        getWelcomeResponse(callback);
    } else {
        callback(session.attributes,
            buildSpeechletResponseWithoutCard(session.attributes.speechOutput, session.attributes.repromptText, false));
    }
}

// Provide a help prompt for the user, explaining how the first aid service works. Then, continue the service
// if there is one in progress, or provide the option to start another one.
function handleGetHelpRequest(intent, session, callback) {
    // Ensure that session.attributes has been initialized
    if (!session.attributes) {
        session.attributes = {};
    }

    // This array stores the ten high level first aid items
    // Recite them if the user asks "what can I say?"
    var highLevelItems = [
        "Checking an injured adult",
        "Choking",
        "CPR",
        "AED",
        "Controlling bleeding",
        "Burns",
        "Poisoning",
        "Neck injuries",
        "Spinal injuries",
        "Stroke"
    ];

    // Set a flag to track that we're in the Help state.
    session.attributes.userPromptedToContinue = true;

    // help dialogue
    var speechOutput = "You must state the nature of the emergency."
        + " For example, say somone is injured or someone needs CPR."
        + " To start from the beginning, say start over or return to beginning."
        + " Say something in the category of: ";
    var repromptText = "To use the service, state the nature of the emergency."
        + " Say something in the category of: ";
    var i=0;
    for (i=0;i<highLevelItems.length-1;i++){
        speechOutput += highLevelItems[i] + ", ";
        repromptText += highLevelItems[i] + ", ";
    }
    speechOutput += "or " + highLevelItems[i] + ".";
    repromptText += "or " + highLevelItems[i] + ".";
    var shouldEndSession = false;

    callback(session.attributes,
        buildSpeechletResponseWithoutCard(speechOutput, repromptText, shouldEndSession));
}

function handleFinishSessionRequest(intent, session, callback) {
    // End the session with a "Good bye!" if the user wants to quit the first aid helper
    callback(session.attributes, buildSpeechletResponseWithoutCard("Thank you for using Alexa First Aid! Goodbye!", "", true));
}

// helper function to see if request is valid
function isRequestValid(intent) {
    var requestSlotFilled = intent.slots && intent.slots.Item && intent.slots.Item.value;
    var requestValid = intent.slots.Item.value.length>0;
    return requestSlotFilled && requestValid;
}

// ------- Helper functions to build responses -------
// NOTE: the three functions below are copied from the ReindeerGames tutorial from the Discussion in week 4
function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: title,
            content: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildSpeechletResponseWithoutCard(output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}

