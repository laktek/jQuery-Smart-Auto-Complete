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
  maxResults: (integer) maximum number of results to return (default: null (unlimited)) - works only with the default filter
  delay: (integer) delay before autocomplete starts (default: 300ms)
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
  resultsContainer: (selector) to which elements the result should be appended.
  resultElement: (selector) references to the result elements collection (e.g. li, div.result) 

  events:
  keyIn: fires when user types into the field
  filterReady: fires when the filter function returns
  showResults: fires when results are shown 
  hideResults: fires when results are hidden
  noMatch: fires when filter returns an empty array to append to the view
  itemSelect: fires when user selects an item from the result list
  itemOver: fires when user highlights an item with mouse or arrow keys
  itemOut: fires when user moves out from an highlighted item

 })
*/

(function($){
  $.fn.smartAutoComplete = function(){    

    if(arguments.length < 1){
      // get the smart autocomplete object of the first element and return 
      var first_element = this[0];
      return $(first_element).data("smart-autocomplete")
    }

    var default_filter_matcher = function(term, source, context){
                                    var matcher = new RegExp(term.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), "i" );

                                    return $.grep(source, function(value) {
                                      return matcher.test( value );
                                    });

                                 }

    var default_options = {
                            minCharLimit: 2, 
                            maxResults: null,
                            delay: 0,
                            disabled: false,
                            forceSelect: false,
                            resultElement: "li",

                            resultFormatter: function(r){ return ("<li>" + r + "</li>"); },

                            filter: function(term, source){    
                              var context = this;
                              var options = $(context).data('smart-autocomplete');
                              var truncated_results = function(results){
                                return (options.maxResults > 0 ? results.splice(0, options.maxResults) : results);
                              }

                              //when source is an array
                              if($.type(source) === "array") {
                                // directly map
                                var results = default_filter_matcher(term, source, context);
                                $(context).trigger('filterReady', [truncated_results(results)]);
                              }
                              //when source is a string
                              else if($.type(source) === "string"){
                                // treat the string as a URL endpoint
                                // pass the query as 'term'

                                $.ajax({
                                  url: source,
                                  data: {"term": term},
                                  dataType: "json",
                                  success: function( data, status, xhr ) {
                                    $(context).trigger('filterReady', [truncated_results(results)]);
                                  },
                                  error: function( xhr ) {
                                     //handle errors
                                  }
                                });
                                
                              }

                            },

                            showResults: function(){    
                              var context = $(this.context);
                              var results_container = $(this.resultsContainer);

                              //show the results container after aligning it with the field 
                              if(this.alignResultsContainer){
                                results_container.css({ 
                                      position: "absolute",
                                      top: function(){ return context.offset().top + context.height(); }, 
                                      left: function(){ return context.offset().left; }, 
                                      width: function(){ return context.width(); } 
                                })
                              }  
                              results_container.show();

                              // hide the results container when click outside of it
                              this.bindHideResultsContainerOnBlur();
                              
                            },

                            hideResults: function(){    
                              //if force select is selected, set the current value
                              if(this.forceSelect)
                                this.setCurrentSelectionToContext();

                              //show the results container if it's hidden (or append it after the field if it was created on the fly)
                              if($(this.resultsContainer))
                                $(this.resultsContainer).hide();
                            },

                            noMatch: function(){    
                              var result_container = $(this.resultsContainer);
                              if(result_container){
                               //clear previous results
                               this.clearResults(); 

                               result_container.append("<li class='_smart_autocomplete_no_result'>Sorry, No Results Found</li>");
                              }

                            },

                            itemSelect: function(selected_item){    
                              //return if no result item is selected
                              if($(selected_item).hasClass('_smart_autocomplete_no_result'))
                                return;

                              //get the context
                              var context = this.context;

                              //get the text from selected item
                              var selected_value = $(selected_item).text();
                              //set it as the value of the autocomplete field
                              $(context).val(selected_value); 

                              //clear raw results hash
                              this.rawResults = [];

                              //hide results container
                              $(context).trigger('hideResults');
                            },

                            itemOver: function(selected_item){    
                              $(selected_item).addClass("highlight");
                            },

                            itemOut: function(selected_item){    
                              $(selected_item).removeClass("highlight");
                            },
                             
                            clearResults: function(){
                              $(this.resultsContainer).html("");
                            },

                            bindHideResultsContainerOnBlur: function(){
                              var context = $(this.context);
                              var results_container = $(this.resultsContainer);
                              $(document).bind('mousedown.smart_autocomplete', function(event){ 
                                var elemIsParent = $.contains(results_container[0], event.target);
                                if(event.target == results_container[0] || event.target == context[0] || elemIsParent) return
               
                                $(context).trigger('hideResults');
                                $(document).unbind("mousedown.smart_autocomplete");
                              });
                            },
                            
                            setCurrentSelectionToContext: function(){
                                if(this.rawResults.length > 0)
                                  $(this.context).val(this.rawResults[(this.currentSelection || 0)]);
                            }

    };
    
    var passed_options = arguments[0];

    return this.each(function(i) { 
      //set the options
      var options = $.extend(default_options, $(this).data("smart-autocomplete"), passed_options);
      //set the context
      options['context'] = this;

      //if a result container is not defined
      if(!options.resultsContainer){

        //define the default result container if it is already not defined
        if($("._smart_autocomplete_container").length < 1){
          var default_container = $("<ul class='_smart_autocomplete_container' style='display:none'></ul>");
          default_container.appendTo("body");
        }
        else
          var default_container = $("._smart_autocomplete_container");

        options.resultsContainer = default_container;
        options.alignResultsContainer = true;
      }

      // save the values in data object
      $(this).data("smart-autocomplete", options);

      // bind user events
      $(this).keyup(function(ev){
        //get the options
        var options = $(this).data("smart-autocomplete");

        //up arrow
        if(ev.keyCode == '38'){
          var current_selection = options.currentSelection || 0;
          var result_suggestions = $(options.resultsContainer).children();

          if(current_selection >= 0)
            $(result_suggestions[current_selection]).removeClass("highlight");

          if(--current_selection <= 0)
            current_selection = 0;

          options['currentSelection'] = current_selection;

          $(this).trigger('itemOver', [ result_suggestions[current_selection] ] );
          
          //save the options
          $(this).data("smart-autocomplete", options); 
        }

        //down arrow
        else if(ev.keyCode == '40'){
          var current_selection = options.currentSelection;
          var result_suggestions = $(options.resultsContainer).children();

          if(current_selection >= 0)
            $(result_suggestions[current_selection]).removeClass("highlight");

          if(isNaN(current_selection) || (++current_selection >= result_suggestions.length) )
            current_selection = 0;

          options['currentSelection'] = current_selection;

          $(this).trigger('itemOver', [ result_suggestions[current_selection] ] );
          
          //save the options
          $(this).data("smart-autocomplete", options); 

        }

        //right arrow & enter key
        else if(ev.keyCode == '39' || ev.keyCode == '13'){
          var current_selection = options.current_selection;
          var result_suggestions = $(options.resultsContainer).children();

          $(this).trigger('itemSelect', [ result_suggestions[current_selection] ] );
          return false;
        }

        else {
         //check minimum number of characters are typed
         if($(this).val().length > options.minCharLimit){
          $(this).trigger('keyIn', [$(this).val()]); 
         }
        }
      });

      $(this).focus(function(){
        //disable form submission while auto suggest field has focus 
        $(this).closest("form").bind("submit.block_for_autocomplete", function(ev){
           return false; 
        });

        if(options.forceSelect){
          $(this).select(); 
        }
      });

      $(this).blur(function(ev){
        $(this).closest("form").unbind("submit.block_for_autocomplete");
        //set a timeout to trigger hide results
        //$(this).trigger('hideResults'); 
      });

      //bind events to results container
      $(options.resultsContainer).delegate(options.resultElement, 'mouseenter', function(){
        var current_selection = options.currentSelection;
        var result_suggestions = $(options.resultsContainer).children();

        $(result_suggestions[current_selection]).removeClass("highlight");

        options['currentSelection'] = $(this).prevAll().length;

        $(options.context).trigger('itemOver', [this] );
          
        //save the options
        $(this).data("smart-autocomplete", options); 

      });

      $(options.resultsContainer).delegate(options.resultElement, 'mouseleave', function(){
        $(options.context).trigger('itemOut', [this] );
      });

      //bind plugin specific events
      $(this).bind('keyIn.smart_autocomplete', function(ev, query){
        var smart_autocomplete_field = this;
        var options = $(smart_autocomplete_field).data("smart-autocomplete");
        var source = options.source || null;
        var filter = options.filter;
        var context = this;

        if(options.disabled)
          return false;

        //call the filter function with delay
        setTimeout(function(){ filter.apply(context, [query, options.source]) }, options.delay);

      });

      $(this).bind('filterReady.smart_autocomplete', function(ev, results){
        var smart_autocomplete_field = this;
        var options = $(smart_autocomplete_field).data("smart-autocomplete");

        //exit if smart complete is disabled
        if(options.disabled)
          return false;

        //save the raw results
        options.rawResults = results;
        $(smart_autocomplete_field).data("smart-autocomplete", options);

        //fire the no match event and exit if no matching results
        if(results.length < 1){
          $(smart_autocomplete_field).trigger('noMatch');
          return false
        }

        //call the results formatter function
        var formatted_results = $.map(results, function(result){
          return options.resultFormatter.apply(smart_autocomplete_field, [result]);
        });

        var formatted_results_html = formatted_results.join("");

        //clear all previous results 
        $(smart_autocomplete_field).smartAutoComplete().clearResults();

        //undelegate any previous delegations
        $(options.resultsContainer).undelegate(options.resultElement, 'click.smart_autocomplete');

        //append the results to the container
        $(options.resultsContainer).append(formatted_results_html);

        //bind an event to trigger item selection
        $(options.resultsContainer).delegate(options.resultElement, 'click.smart_autocomplete', function(){
          $(smart_autocomplete_field).trigger('itemSelect', this);
        });

        //trigger results ready event
        $(smart_autocomplete_field).trigger('showResults', [options.resultsContainer, results]);

      });

      $(this).bind('showResults.smart_autocomplete', function(ev, result_container, raw_results){

        var smart_autocomplete_field = this;
        var options = $(smart_autocomplete_field).data("smart-autocomplete");

        //run the default event if no custom handler is defined
        if($(smart_autocomplete_field).data('events')['showResults'].length > 1)
          return;

        $(smart_autocomplete_field).smartAutoComplete().showResults(result_container, raw_results);
      });

      $(this).bind('hideResults.smart_autocomplete', function(ev){

        var smart_autocomplete_field = this;

        //run the default event if no custom handler is defined
        if($(smart_autocomplete_field).data('events')['hideResults'].length > 1)
          return;

        $(smart_autocomplete_field).smartAutoComplete().hideResults();
      });

      $(this).bind('noMatch.smart_autocomplete', function(ev){

        var smart_autocomplete_field = this;

        //run the default event if no custom handler is defined
        if($(smart_autocomplete_field).data('events')['noMatch'].length > 1)
          return;

        $(smart_autocomplete_field).smartAutoComplete().noMatch();
      });

      $(this).bind('itemSelect.smart_autocomplete', function(ev, selected_item){

        var smart_autocomplete_field = this;

        //run the default event if no custom handler is defined
        if($(smart_autocomplete_field).data('events')['itemSelect'].length > 1)
          return;

        $(smart_autocomplete_field).smartAutoComplete().itemSelect(selected_item);
      });

      $(this).bind('itemOver.smart_autocomplete', function(ev, selected_item){

        var smart_autocomplete_field = this;

        //run the default event if no custom handler is defined
        if($(smart_autocomplete_field).data('events')['itemOver'].length > 1)
          return;

        $(smart_autocomplete_field).smartAutoComplete().itemOver(selected_item);
      });

      $(this).bind('itemOut.smart_autocomplete', function(ev, selected_item){

        var smart_autocomplete_field = this;

        //run the default event if no custom handler is defined
        if($(smart_autocomplete_field).data('events')['itemOut'].length > 1)
          return;

        $(smart_autocomplete_field).smartAutoComplete().itemOut(selected_item);
      });

    });
  }

})(jQuery);
