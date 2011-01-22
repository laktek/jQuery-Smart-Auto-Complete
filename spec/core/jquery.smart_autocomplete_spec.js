describe('Smart AutoComplete', function () {
    
    beforeEach(function () {
       setFixtures("<input id='autoCompleteField'/>");
    });

    describe('initializing with default values', function(){

      var smart_autocomplete_options;

      beforeEach(function(){
        $("#autoCompleteField").smartAutoComplete();
        smart_autocomplete_options = $("#autoCompleteField").data("smart-autocomplete");
      });

      it('minimum character length should be 2', function () {
        expect(smart_autocomplete_options.minCharLimit).toEqual(2);
      });

      it('maximum results should be unlimited', function () {
        expect(smart_autocomplete_options.maxResults).toEqual(-1);
      });

      it('delay should be 300ms', function () {
        expect(smart_autocomplete_options.delay).toEqual(300);
      });

      it('type ahead should be false', function () {
        expect(smart_autocomplete_options.typeAhead).toEqual(false);
      });

      it('disabled should be false', function () {
        expect(smart_autocomplete_options.disabled).toEqual(false);
      });

      it('force select should be false', function () {
        expect(smart_autocomplete_options.forceSelect).toEqual(false);
      });

    });

    describe('overriding default values', function(){

      it('takes hardcoded options', function(){
       setFixtures("<input id='autoCompleteFieldHardCoded' data-smart-autocomplete='{\"minCharLimit\": 4 }'/>");
       $("#autoCompleteFieldHardCoded").smartAutoComplete();
       smart_autocomplete_options = $("#autoCompleteFieldHardCoded").data("smart-autocomplete");

       expect(smart_autocomplete_options.minCharLimit).toEqual(4);
      });

      it('minimum character limit set to 4', function () {
       $("#autoCompleteField").smartAutoComplete({minCharLimit: 4});
       smart_autocomplete_options = $("#autoCompleteField").data("smart-autocomplete");

       expect(smart_autocomplete_options.minCharLimit).toEqual(4);
      });

      it('maximum results set to 10', function () {
       $("#autoCompleteField").smartAutoComplete({maxResults: 10});
       smart_autocomplete_options = $("#autoCompleteField").data("smart-autocomplete");

       expect(smart_autocomplete_options.maxResults).toEqual(10);
      });

      it('delay set to 10ms', function () {
       $("#autoCompleteField").smartAutoComplete({delay: 10});
       smart_autocomplete_options = $("#autoCompleteField").data("smart-autocomplete");

       expect(smart_autocomplete_options.delay).toEqual(10);
      });

      it('type ahead set to true', function () {
       $("#autoCompleteField").smartAutoComplete({typeAhead: true});
       smart_autocomplete_options = $("#autoCompleteField").data("smart-autocomplete");

       expect(smart_autocomplete_options.typeAhead).toEqual(true);
      });

      it('disabled set to true', function () {
       $("#autoCompleteField").smartAutoComplete({disabled: true});
       smart_autocomplete_options = $("#autoCompleteField").data("smart-autocomplete");

       expect(smart_autocomplete_options.disabled).toEqual(true);
      });

      it('force select set to true', function () {
       $("#autoCompleteField").smartAutoComplete({forceSelect: true});
       smart_autocomplete_options = $("#autoCompleteField").data("smart-autocomplete");

       expect(smart_autocomplete_options.forceSelect).toEqual(true);
      });

    });

    describe('when user enters a value to the field', function(){

      it("performs no action if disabled", function(){
        $("#autoCompleteField").smartAutoComplete({disabled: true});
        //expect($("#autoCompleteField").trigger("keyIn")).toBeFalsy();
      });
      
      it("calls the filter function with query and source", function(){
        var output_buffer;
        $("#autoCompleteField").smartAutoComplete({filter: function(q, s){ output_buffer = "received " + q + " & " + s; }, source: "test"});
        $("#autoCompleteField").trigger("keyIn", "t");
        expect(output_buffer).toEqual("received t & test");
      });

    });

    describe('when filtered results are ready', function(){

      var result_formatter_called = false;
      var custom_filter_function = function(){ $(this).trigger('filterReady', [["a", "b", "c"]]) };
      var result_formatter_function = function(r){ result_formatter_called = true; return r };

      it("format the results using the result formatter function", function(){
        $("#autoCompleteField").smartAutoComplete({filter: custom_filter_function, resultFormatter: result_formatter_function });
        $("#autoCompleteField").trigger("keyIn", "t");
        expect(result_formatter_called).toBeTruthy();
      });

      it("should append the results to given appendTo element", function(){
        setFixtures("<input id='autoCompleteField'/><div id='autoCompleteAppendToBlock'></div>");
        $("#autoCompleteField").smartAutoComplete({filter: custom_filter_function, resultFormatter: result_formatter_function, appendTo: "#autoCompleteAppendToBlock" });
        $("#autoCompleteField").trigger("keyIn", "t");

        expect($("#autoCompleteAppendToBlock")).toHaveHtml("abc");

      });

    
    });

});
