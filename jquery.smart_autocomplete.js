/**
 * Smart Auto Complete plugin 
 * 
 * Copyright (c) 2011 Lakshan Perera (laktek.com)
 * Licensed under the MIT (MIT-LICENSE.txt)  licenses.
 * 
*/

/*
 $(target).smartAutoComplete({options})
  options:
  minCharLimit: (integer) minimum characters user have to type before invoking the autocomplete (default: 2)
  maxResults: (integer) maximum number of results to return (default: -1 (unlimited))
  delay: (integer) delay before autocomplete starts (default: 300ms)
  typeAhead: (boolean) fill the field with the best matching result, as in google instant search (default: false)
             and fires the select event.
  disabled: (boolean) whether autocomplete disabled on the field (default: false)
  forceSelect: (boolean) always fills the field with best matching result, without leaving custom input (similar to a select field) (default false)
  source:  (array/function) you can supply an array or callback function that would return an array for the source
           this is optional if you prefer to have your own filter method 
           eg: ["Apple", "Banana", "Mango"] or [["Apple", 1], ["Banana", 2], ["Mango", 3]]
           or [["Apple", 1, {picture: 'apple.jpg'}], ["Banana", 2, {picture: 'banana.jpg'}], ["Mango", 3, {picture: 'mango.jpg'}]]
  filter: (function) define a function on that would return matching items to the query (use this if you want to override the default filtering algorithm)
          expects to return an array 
          arguments: query, list
  resultFormatter: (function) the function you supply here will be called to format the output of the individual result.
                   expects to return a string
                   arguments: result 
  appendTo: (selector) to which elements the result should be appended.

  events:
  keyIn: fires when user types into the field
  filterReady: fires when the filter function returns
  noMatch: fires when filter returns an empty array to append to the view
  resultsReady: fires when filtered results are appended to the view 
  itemHover: fires when user hovers over an item in the result list
  itemSelect: fires when user selects an item from the result list
 })
*/

(function($){
  $.fn.smartAutoComplete = function(){    

    var default_options = { minCharLimit: 2, maxResults: -1, delay: 300, typeAhead: false, disabled: false, forceSelect: false };
    var passed_options = arguments[0] || {};

    return this.each(function(i) { 
      //set the options
      var options = $.extend(default_options, $(this).data("smart-autocomplete"), passed_options);
      initialized_options = options;
      $(this).data("smart-autocomplete", options);

      //bind the events
      $(this).bind('keyIn.smart_autocomplete', function(ev, query){
        var smart_autocomplete_field = this;
        var options = $(smart_autocomplete_field).data("smart-autocomplete");
        var source = options.source || null;

        if(options.disabled)
          return false;

        //call the filter function
        options.filter.apply(this, [query, options.source]);

      });

      $(this).bind('filterReady.smart_autocomplete', function(ev, results){
        var smart_autocomplete_field = this;
        var options = $(smart_autocomplete_field).data("smart-autocomplete");
        var result_formatter = options.resultFormatter;
        var appendTo = options.appendTo;

        if(options.disabled)
          return false;

        //call the results formatter function
        var formatted_results = $.map(results, function(result){
          return result_formatter.apply(smart_autocomplete_field, [result]);
        });

        //check whether an appendTo element is defined
        if(appendTo)
          $(appendTo).append(formatted_results.join(""));

      });

    });
  }
})(jQuery);

