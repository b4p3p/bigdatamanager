"use strict";

var BootstrapTableFilter = function(idFilter) {

    this.idFilter = idFilter;
    this.contFilter = 0;

    this.allList = '#' + idFilter + " div.btn-group-filter-main ul li";
    this.$allList = $( this.allList );

    this.allFilter = '#' + idFilter + " div.btn-group-filters div";
    this.$allFilter = $( this.allFilter );

    this.$btnFilter = $('#' + idFilter);

    this.$allList.each(function () {

        $(this).click(function (e) {

            var $input = $(this).find("input");
            if($input.length == 0) return;

            $input = $input[0];

            var key = $(e.currentTarget).attr("data-filter-field");
            var divcombo = $('div[data-filter-field=' + key + ']');
            var combo = divcombo.find("select");

            if (e.toElement.tagName != "INPUT") {
                $input.checked = !$input.checked;
            }

            if ($input.checked) {
                $(divcombo).removeClass('hidden');
                bootstrapTableFilter.contFilter++;
            }
            else {
                if(combo.length > 0)
                    DomUtil.deselectAll(combo[0], true);    //deseleziono tutto se è una combo

                $(divcombo).addClass('hidden');
                bootstrapTableFilter.contFilter--;
            }

            if (bootstrapTableFilter.contFilter == 0)
                $('#refresh').addClass('hidden');
            else
                $('#refresh').removeClass('hidden');

            e.stopPropagation();
        })
    });

    var btnRemoveFilters = $('#' + idFilter + ' .remove-filters')[0];

    $(btnRemoveFilters).click( function (e) {

        ShowDataCtrl.deselectCombo();

        $('#refresh').addClass('hidden');
        bootstrapTableFilter.contFilter = 0;

        bootstrapTableFilter.$allFilter.each(function(item){
            $(this).addClass('hidden');
        });

        bootstrapTableFilter.$allList.each(function(item){
            var input = $(this).find("input");
            if(input.length > 0 )
                input[0].checked = false;
        });

    });

    this.showFilter = function() {
        this.$btnFilter.removeClass('hidden');
    }
};