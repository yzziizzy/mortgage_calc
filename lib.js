var units = {
	inv_time: [
		'days',
		'weeks',
		'months',
		'quarters',
		'years',
	],
	
	roof_types: [
		'metal',
		'asphalt',
		'tile',
	],
	
};


$(function() {
	
	$('.tab-group').each(function() {
		var grp = $(this);
		
		var bar = $('<div class="tab-bar"></div>');
		
		grp.find('> .tab').each(function() {
			var contents = $(this);
			var tab = $('<div class="tab-bar-tab">'+$(this).attr('title')+'</div>');
			tab.click(function() {
				bar.find('.tab-bar-tab').removeClass('active');
				tab.addClass('active');
				grp.find('> .tab').removeClass('active').hide();
				contents.addClass('active').show();
			});
			
			bar.append(tab);
		});
		
		bar.find('.tab-bar-tab:first').addClass('active');
		
		// handle next/prev links
		grp.find('.next-tab').click(function(e) {
			e.defaultPrevented = true;
			
			var ct = grp.find('.tab.active');
			var nt = ct.next('.tab');
			ct.removeClass('active').hide();
			nt.addClass('active').show();
			
			ct = bar.find('.tab-bar-tab.active');
			nt = ct.next('.tab-bar-tab');
			ct.removeClass('active');
			nt.addClass('active');
		});
		
		grp.find('.prev-tab').click(function(e) {
			e.defaultPrevented = true;
			
			var ct = grp.find('.tab.active');
			var nt = ct.prev('.tab');
			ct.removeClass('active').hide();
			nt.addClass('active').show();
			
			ct = bar.find('.tab-bar-tab.active');
			nt = ct.prev('.tab-bar-tab');
			ct.removeClass('active');
			nt.addClass('active');
		});
		
		grp.prepend(bar);
		
	});

	// magical controls
	$('scalar').each(function() {
		var elem = $(this);
		var name = elem.attr('name');
		var internal_type = elem.attr('type');
		var def = elem.attr('default');
		
		var control = $('<div class="control"></div>');
		control.append('<label>' + elem.html() + '</label>');
		control.append('<input type="edit" cname="'+name+'" internal="'+internal_type+'" value="'+def+'" />');
		
		elem.replaceWith(control);
	});

	// magical unit controls
	$('unit').each(function() {
		var elem = $(this);
		var name = elem.attr('name');
		var internal_type = elem.attr('type');
		var def = elem.attr('default');
		
		var control = $('<div class="control"></div>');
		control.append('<label>' + elem.html() + '</label>');
		control.append('<input type="edit" cname="'+name+'" internal="'+internal_type+'" value="'+def+'" />');
		
		var sel = $('<select cname="'+name+'__type">');
		sel.append(units[elem.attr('type')].map(function(x) {
			return $('<option value="'+x+'">'+x+'</option>');
		}));
		
		control.append(sel);
		
		elem.replaceWith(control);
	});

	// magical selectbox controls
	$('choose').each(function() {
		var elem = $(this);
		var name = elem.attr('name');
		var internal_type = elem.attr('type');
		
		var control = $('<div class="control"></div>');
		control.append('<label>' + elem.html() + '</label>');
		
		var sel = $('<select cname="'+name+'" internal="'+internal_type+'">');
		sel.append(units[elem.attr('type')].map(function(x) {
			return $('<option value="'+x+'">'+x+'</option>');
		}));
		
		control.append(sel);
		
		elem.replaceWith(control);
	});

	var radio_counter = 0;
	$('radio').each(function() {
		radio_counter++;
		
		var elem = $(this);
		var name = elem.attr('name');
		
		var control = $('<fieldset class="control radio"></fieldset>');
		control.append($('<legend>'+elem.attr('title')+'</legend>'));
		var hi = $('<input type="hidden" internal="string" cname="'+elem.attr('name')+'" />');
		control.append(hi);
		
		
		elem.find('> opt').each(function() {
			var title = $(this).attr('title');
			
			var opt_container = $('<fieldset class="radio-option unselected"></fieldset>');
			var value = $(this).attr('value');
			var legend = $('<legend>'+title+'</legend>');
			
			var def = "";
			if($(this).attr('default')) {
				def = 'checked="checked"';
				hi.attr('value', value);
			}
			
			var radio_box = $('<input type="radio" name="radio_'+radio_counter+'" '+def+' />');
			
			function clickfn(e) {
				control.find('> fieldset.radio-option').addClass('unselected');
				opt_container.removeClass('unselected');
				hi.attr('value', value);
				radio_box.prop('checked', true);
			}
			radio_box.click(clickfn);
			legend.click(clickfn);
			
			opt_container.append(legend.prepend(radio_box));
			opt_container.append($(this).html());
			
			control.append(opt_container);
		});
		
		elem.replaceWith(control);
	});
	
	
});

function grab_value(name) {
	var n = $('[cname="'+name+'"]');
	var n_t = $('[cname="'+name+'__type"]');
	
	if(!n) return NaN;
	
	var val = n.val();
	if(n_t.length) {
		var t = n_t.val();
		
		return {
			scalar: val,
			unit: t,
		};
	}
	
	return val;
};
















function mkChart(sel, title, data) {
	
	console.log(data);
	var legend = [];
	
	var d2 = data.map(function(ds) {
		legend.push(ds[0]);
		return ds[1].map(function(x, k) {
			return {
				period: k,
				value: x,
			}
		});
	});
	
	
	console.log(d2);
	
//  d2 = MG.convert.date(d2, 'date');
	MG.data_graphic({
		title: title,
		data: d2,
		width: 1100,
		height: 500,
		area: false,
		right: 100,
		left: 70,
		target: sel,
		x_accessor: 'period',
		y_accessor: 'value',
		yax_units: '$',
		xax_count: 12,
		decimals: 0,
		legend: legend,
	});
	
// 	var ctx = $(sel)[0].getContext("2d");
// 	var chart = new Chart(ctx).Line(chartData, opts);
	
}


function grabData(parent) {
	var data = {};
	
	function asFloat(x) {
		var y = parseFloat(x);
		return isFinite(y) ? y : 0;
	}
	
	var formatters = {
		string: function(x) { return x },
		pct: function(x) { return asFloat(x) * .01 },
		amort: function(x) { return asFloat(x) / 12 },
		num: asFloat,
		
		time: asFloat,
		dollars: asFloat,
		percent: function(x) { return asFloat(x) * .01 },
	};
	
// 			parent.find('[data-json]').each(function() {
	parent.find('[cname]').each(function() {
		var n = $(this);
		
		var name = n.attr('cname');
		var val = n.val();
		
		var fmt = n.attr('fmt') || n.attr('internal') || 'num';
		console.log(name, val);
		
		data[name] = formatters[fmt](val);
	});
	
	return data;
};




function accumulate(arr, init, begin) {
	var acc = init || 0;
	var o = [];

	for(var i = 0; i < arr.length; i++) {
		if(begin) o.push(acc);
		acc += arr[i];
		if(!begin) o.push(acc);
	}
	
	return o;
}

function sum(a, b) {
	var o = [];
	for(var i = 0; i < a.length; i++) {
		o.push(a[i] + b[i]);
	}
	return o;
}
function mul(a, b) {
	var o = [];
	for(var i = 0; i < a.length; i++) {
		o.push(a[i] * b[i]);
	}
	return o;
}

function inchworm(arr, first, fn) {
	var o = [];
	var last = first;
	
	for(var i = 0; i < arr.length; i++) {
		o[i] = fn(last, arr[i]);
		last = arr[i];
	}
	
	return o;
}


function constantValue(val) {
	return function() { return val; }
}



/*

A = periodic payment amount
P = net principle
i = periodic interest rate (mon_interest above)
n = total number of payments (first payment is 30 days after the loan originates)
p(t) = principle remaining at time t

A = P(((i(1_i)^n) / ((1+i)^n - 1))
	= (Pi) / (1- (1+i)^-n)
	= P(i + ( i / ((1+i)^n - 1) ) 

p(t) / P = 1 - ( ((1+it^t - 1)) / ((1+i)^n - 1) )


calculation of mortgage stuff:

1) calculate the monthly payment amount using loan amount and interest

2) for each pay period, 
	calc interest i_p = (remaining balance * monthly interest)
	calc payment principle = payment - i_p
	calc new blance = first balance - payment principle
	
*/

function monthlyPayment(loan_amount, monthly_interest, num_payments) {
	return (loan_amount * monthly_interest) / (1 - Math.pow(1 + monthly_interest, -num_payments) );
}

function piRatios(balance, monthly_interest, payment_amount) {
	var i_p = balance * monthly_interest;
	return {
		principle: payment_amount - i_p,
		interest: i_p,
		new_balance: balance - payment_amount + i_p,
	};
}


function annualToMonthlyInterest(annual) {
	return Math.pow(1 + annual, 1/12) - 1;
}



// crap
function periodSuccessor(o) {
	
	var n = _.extend({}, o);
	
	var ltv = parseFloat((o.loan_balance / o.purchase_price).toFixed(2));
	
	var pmi = 0;
	if(ltv > .80) {
		pmi = o.pmi;
	}
	
	var app_amt = o.house_value * o.app_rate / 12;
	n.house_value += app_amt;
	
	var p_i = piRatios(o.loan_balance, o.monthly_interest, o.payment_amount);
	
// 			_total_principle += p_i.principle;
// 			_total_interest += p_i.interest;
// 			_total_insurance += insurance;
	
	n.equity += p_i.principle + app_amt;
	
	var _monthly_cost = p_i.interest + o.insurance + pmi + o.overhead
	n.acc_cost += _monthly_cost;
	
	

	n.period = o.period + 1;
	n.ltv = ltv;
	n.pmi = pmi,
	n.interest = p_i.interest;
	n.principle = p_i.principle;
	n.loan_balance = p_i.new_balance;

	n.appreciation = app_amt;
	n.equity = n.acc_cost - o.downpayment
	
	n.loan_balance = p_i.new_balance;
	
	return n;
}


// probably has floating point precision problems
function amortTable(loanAmount, apr, months) {
	var o = {
		principle: [],
		interest: [],
		payment: [],
		period: [],
		loan_balance: [],
		ending_balance: [],
	};
	
	var payment = monthlyPayment(loanAmount, apr / 12, months);
	
	for(var i = 0; i <= months; i++) {
		
		var p_i = piRatios(loanAmount, apr / 12, payment);
		
		o.loan_balance[i] = loanAmount;
		loanAmount = p_i.new_balance;
		
		o.payment[i] = payment;
		o.principle[i] = p_i.principle;
		o.interest[i] = p_i.interest;
		o.ending_balance[i] = p_i.new_balance;
		o.period[i] = i;
	}
	
	return o;
}

