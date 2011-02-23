/**
 * Smart Auto Complete plugin 
 * 
 * Copyright (c) 2011 Lakshan Perera (laktek.com)
 * Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)  licenses.
 * 
*/

/*
 Requirements: jQuery 1.5 or above

  Usage:
  $(target).smartAutoComplete({options})

  Options:
  minCharLimit: (integer) minimum characters user have to type before invoking the autocomplete (default: 1)
  maxResults: (integer) maximum number of results to return (default: null (unlimited))
  delay: (integer) delay before autocomplete starts (default: 0)
  disabled: (boolean) whether autocomplete disabled on the field (default: false)
  forceSelect: (boolean) always fills the field with best matching result, without leaving custom input (similar to a select field) (default: false)
  source:  (string/function) you can supply an array with items or a string containing a URL to fetch items for the source
           this is optional if you prefer to have your own filter method 
  filter: (function) define a custom function that would return matching items to the entered text (this will override the default filtering algorithm)
          should return an array or a Deferred object (ajax call)
          parameters available: term, source 
  resultFormatter: (function) the function you supply here will be called to format the output of an individual result.
                   should return a string
                   parameters available: result 
  resultsContainer: (selector) to which element(s) the result should be appended.
  resultElement: (selector) references to the result elements collection (e.g. li, div.result) 

  Events:
  keyIn: fires when user types into the field (parameters: query)
  resultsReady: fires when the filter function returns (parameters: results)
  showResults: fires when results are shown (parameters: results)
  hideResults: fires when results are hidden
  noMatch: fires when filter returns an empty array to append to the view
  itemSelect: fires when user selects an item from the result list (paramters: item)
  itemOver: fires when user highlights an item with mouse or arrow keys (paramters: item)
  itemOut: fires when user moves out from an highlighted item (paramters: item)

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
                            minCharLimit: 1, 
                            maxResults: null,
                            delay: 0,
                            disabled: false,
                            forceSelect: false,
                            resultElement: "li",

                            resultFormatter: function(r){ return ("<li>" + r + "</li>"); },

                            filter: function(term, source){    
                              var context = this;
                              var options = $(context).data('smart-autocomplete');
                              

                              //when source is an array
                              if($.type(source) === "array") {
                                // directly map
                                var results = default_filter_matcher(term, source, context);
                                return results; 
                              }
                              //when source is a string
                              else if($.type(source) === "string"){
                                // treat the string as a URL endpoint
                                // pass the query as 'term'

                                return $.ajax({
                                  url: source,
                                  data: {"term": term},
                                  dataType: "json"
                                });
                                
                              }

                            },

                            alignResultsContainer: false,

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
                            },

                            setItemSelected: function(val){
                              this.itemSelected = val;
                            }

    };

    //define the default events
    $.event.special.keyIn = {
      setup: function(){ return false; }, 

      _default: function(ev){
        var context = ev.target;
        var options = $(context).data("smart-autocomplete");
        var source = options.source || null;
        var filter = options.filter;

        //event specific data
        var query = ev.customData.query;

        if(options.disabled)
          return false;

        //set item selected property
        options.setItemSelected(false);

        //call the filter function with delay
        setTimeout(function(){
          $.when( filter.apply(options, [query, options.source]) ).done(function( results ){
            //do the trimming
            var trimmed_results = (options.maxResults > 0 ? results.splice(0, options.maxResults) : results);

            $(context).trigger('resultsReady', [trimmed_results]);
          });
        }, options.delay);
      }
    };

    $.event.special.resultsReady = {
      setup: function(){ return false },

      _default: function(ev){
        var context = ev.target;
        var options = $(context).data("smart-autocomplete");

        //event specific data
        var results = ev.customData.results;

        //exit if smart complete is disabled
        if(options.disabled)
          return false;

        //clear all previous results 
        $(context).smartAutoComplete().clearResults();

        //save the raw results
        options.rawResults = results;

        //fire the no match event and exit if no matching results
        if(results.length < 1){
          $(context).trigger('noMatch');
          return false
        }

        //call the results formatter function
        var formatted_results = $.map(results, function(result){
          return options.resultFormatter.apply(options, [result]);
        });

        var formatted_results_html = formatted_results.join("");

        //append the results to the container
        $(options.resultsContainer).append(formatted_results_html);

        //trigger results ready event
        $(context).trigger('showResults', [results]);
      }             
    };

    $.event.special.showResults = {
      setup: function(){ return false },

      _default: function(ev){    
        var context = ev.target;
        var options = $(context).data("smart-autocomplete");
        var results_container = $(options.resultsContainer);

        //event specific data
        var raw_results = ev.customData.results; 

        //show the results container after aligning it with the field 
        if(options.alignResultsContainer){
          results_container.css({ 
                position: "absolute",
                top: function(){ return $(context).offset().top + $(context).height(); }, 
                left: function(){ return $(context).offset().left; }, 
                width: function(){ return $(context).width(); } 
          })
        }  
        results_container.show();

        // hide the results container when click outside of it
        options.bindHideResultsContainerOnBlur();
        
      }
    };

    $.event.special.hideResults = {
      setup: function(){ return false },

      _default: function(ev){    
        var context = ev.target;
        var options = $(context).data("smart-autocomplete");

        //if force select is selected and no item is selected, set currently highlighted value
        if(options.forceSelect && !options.itemSelected)
          options.setCurrentSelectionToContext();

        //hide the results container
        $(options.resultsContainer).hide();
      }
    };

    $.event.special.noMatch = {
      setup: function(){ return false },

      _default: function(ev){    
        var context = ev.target;
        var options = $(context).data("smart-autocomplete");
        var result_container = $(options.resultsContainer);

        if(result_container){
         //clear previous results
         options.clearResults(); 

         result_container.append("<li class='_smart_autocomplete_no_result'>Sorry, No Results Found</li>");
        }

      }
    };

    $.event.special.itemSelect = { 
      setup: function(){ return false },

      _default: function(ev){    
        var context = ev.target;
        var options = $(context).data("smart-autocomplete");

        //event specific data
        var selected_item = ev.customData.item;

        //return if no result item is selected
        if($(selected_item).hasClass('_smart_autocomplete_no_result'))
          return;

        //get the text from selected item
        var selected_value = $(selected_item).text();
        //set it as the value of the autocomplete field
        $(context).val(selected_value); 

        //set item selected property
        options.setItemSelected(true);
        
        //hide results container
        $(context).trigger('hideResults');
      }
    };

    $.event.special.itemOver = {
      setup: function(){ return false },

      _default: function(ev){    

        //event specific data
        var item = ev.customData.item;

        $(item).addClass("highlight");
      }
    };

    $.event.special.itemOut = { 
      setup: function(){ return false },

      _default: function(ev){    

        //event specific data
        var item = ev.customData.item;

        $(item).removeClass("highlight");
      }
    }

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
            $(options.context).trigger('itemOut', result_suggestions[current_selection] );

          if(--current_selection <= 0)
            current_selection = 0;

          options['currentSelection'] = current_selection;

          $(this).trigger('itemOver', [ result_suggestions[current_selection] ] );
        }

        //down arrow
        else if(ev.keyCode == '40'){
          var current_selection = options.currentSelection;
          var result_suggestions = $(options.resultsContainer).children();

          if(current_selection >= 0)
            $(options.context).trigger('itemOut', result_suggestions[current_selection] );

          if(isNaN(current_selection) || (++current_selection >= result_suggestions.length) )
            current_selection = 0;

          options['currentSelection'] = current_selection;

          $(this).trigger('itemOver', [ result_suggestions[current_selection] ] );
          
        }

        //right arrow & enter key
        else if(ev.keyCode == '39' || ev.keyCode == '13'){
          var current_selection = options.currentSelection;
          var result_suggestions = $(options.resultsContainer).children();

          $(this).trigger('itemSelect', [ result_suggestions[current_selection] ] );
          return false;
        }

        else {
         //check minimum number of characters are typed
         if($(this).val().length >= options.minCharLimit){
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
      $(options.resultsContainer).delegate(options.resultElement, 'mouseenter.smart_autocomplete', function(){
        var current_selection = options.currentSelection;
        var result_suggestions = $(options.resultsContainer).children();

        options['currentSelection'] = $(this).prevAll().length;

        $(options.context).trigger('itemOver', [this] );
          
      });

      $(options.resultsContainer).delegate(options.resultElement, 'mouseleave.smart_autocomplete', function(){
        $(options.context).trigger('itemOut', [this] );
      });

      $(options.resultsContainer).delegate(options.resultElement, 'click.smart_autocomplete', function(){
        $(options.context).trigger('itemSelect', [this]);
        return false
      });

      //bind plugin specific events
      $(this).bind({
        keyIn: function(ev, query){ ev.customData  = {'query': query } ; },
        resultsReady: function(ev, results){ ev.customData  = {'results': results }; }, 
        showResults: function(ev, results){ ev.customData = {'results': results } },
        noMatch: function(){},
        hideResults: function(){},
        itemSelect: function(ev, item){ ev.customData = {'item': item }; },
        itemOver: function(ev, item){ ev.customData = {'item': item }; },
        itemOut: function(ev, item){ ev.customData = {'item': item }; }
      });
    });
      
  }
})(jQuery);
