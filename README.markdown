jQuery Smart Auto Complete plugin 
=================================
 
## Requirements

jQuery 1.5 or above

## Usage

In the header section of your page, add two script tags referencing to core jQuery and smart autocomplete plugin. It should look similar to code below:

    <script src="jquery.js" type="text/javascript"></script>
    <script src="jquery.smart_autocomplete.js" type="text/javascript"></script>

To activate the plugin call `smartAutoComplete` method with options on target jQuery object. 

    <script type="text/javascript">
    $(function(){

     $(target).smartAutoComplete({options})

    });
    </script>

## Options

### minCharLimit (integer)

**default**: 1

Sets the minimum characters user have to type before invoking the autocomplete 

### maxResults (integer)

**default**: null (means unlimited)

Sets the maximum number of results to return.

### delay (integer)

**default**: 0

Sets delay before calling filter function. 

### disabled (boolean)

**default**: false

Sets whether autocomplete is disabled on the field.

### forceSelect (boolean)

**default**: false

If set to true, field will be always filled with best matching result, without leaving the custom input.
Better to enable this option, if you want autocomplete field to behave similar to a HTML select field. (Check Example 2 in the demo)

### typeAhead (boolean)

**default**: false

If set to true, it will offer the best matching result in grey within the field; that can be auto-completed by pressing the right arrow-key or enter.
This is similar to behaviour in Google Instant Search's query field (Check Example 3 in the demo) 


### source  (string/array)

Defines the list of items to be filtered. You can give a hardcoded array or a string containing a URL, which will return a JSON array, as the source.
Note: Your can omit this option or provide a different object, if you are defining your own filter method 

### filter (function)

**parameters available**: term, source 

Define a custom function that would return the matching items for the term (this will override the default filtering algorithm)
Function should return an array or a Deferred object (ajax call)

### resultFormatter (function) 

**parameters available**: result 

The function you supply here will be called to format the output of an individual result.
Function should return a string

### resultsContainer (selector) 

Define to which element(s) the results should be appended.

### resultElement (selector) 

Reference to the result elements collection (e.g. li, div.result) 

## Events

### keyIn

**parameters**: query 

Fires when user type something in the field 

### resultsReady

**parameters**: results

Fires when results are ready (returned from the filter function) 

### showResults

**parameters**: results

Fires after results are added to the results container 

### noMatch

Fires if filter function returned no results

### hideResults

Fires when results are to be hidden (e.g. field looses focus or after a value is selected)

### itemSelect

**paramters**: item

Fires when user selects an item from the result list 

### itemOver

**paramters**: item

Fires when user focuses on an item in results list with mouse or arrow keys

### itemOut

**paramters**: item

Fires when an item in results list looses focus

## Learn More

## Demo 

Copyright (c) 2011 Lakshan Perera (laktek.com)

Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) licenses.


