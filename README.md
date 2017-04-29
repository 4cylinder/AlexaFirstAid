# AlexaFirstAid

This is my first voice user interface project, utilizing the Alexa Skills Kit and AWS Lambda.

**How to launch**

The user says “Alexa, first aid”. The Alexa skill opens the main menu and replies by saying “First Aid here, what can I help you with?”. If it does not receive a response, it prompts the user to “please state the nature of the emergency.”

**Sample help items**

These three examples show different items, as well as different ways to invoke the same intent:
* User: “I need help with a neck injury”.
* Alexa: “Call 911. Minimize movement of the head, neck, and spine. Place both hands on both sides of the person’s head for stability”.


* User: “Someone’s bleeding”.
* Alexa: "Cover the wound. Apply direct pressure until bleeding stops. Cover the dressing with a bandage. Apply more pressure and call 911.”


* User: “She got burned”
* Alexa: “Remove the source of the burn. Cool the burn with cold running water. Cover the burn loosely with sterile dressing. Call 911. Care for shock.”

**If Alexa does not recognize the command**

Alexa will remind the user that the user must “state the nature of the emergency” and say “For example, say someone is injured or someone needs CPR.” It also reads off the ten supported categories, from “Checking an injured adult” to “Stroke”.

**Asking for help**

The user can say “What can I say” or “I don’t know what to say” and Alexa says “Please state the nature of the emergency” and then “For example, say someone is injured or someone needs CPR.” It also reads off the ten supported categories, from “Checking an injured adult” to “Stroke”.

**CPR Session**

To launch this skill, the user says “Alexa, first aid”. This opens the main menu, where the user can say one of the ten items in order to receive a response on first aid instructions. If the item is “choking”, then the skill will first ask the user to specify whether or not the choking is unconscious, before giving corresponding instructions. If the item is “CPR”, the skill will then go into a loop, instructing the user on the chest compression and breath steps, until the user says “stop CPR” or “quit CPR”, which would return to the main menu. The user can then say “Stop first aid” to exit the skill.
