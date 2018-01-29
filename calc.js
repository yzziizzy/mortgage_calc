

function mortgage_calc(d) {
	
	
	var app_rate;
	console.log(d);
	if(d.appreciation_mode == 'rate') {
		app_rate = d.app_rate;
	}
	else {
		app_rate = Math.pow((d.resell_price - d.resell_closing_costs) / d.purchase_price, 1 / d.resell_months) - 1;
		app_rate *= 12;
	}
	
	
	d.monthly_app_rate = annualToMonthlyInterest(app_rate);
	d.inflation_rate_monthly = annualToMonthlyInterest(d.inflation_rate);
	
	
	d.monthly_interest = d.apr  / 12; // this works with APR's
	var num_payments = d.loan_term * 12;
		
	d.property_tax_rate_monthly = annualToMonthlyInterest(d.property_tax_rate); 
	d.reference_rate_monthly = annualToMonthlyInterest(d.reference_rate); 
	
	var downpayment = d.purchase_price - d.loan_amount;
	
	var pmi_amount = d.loan_amount * d.pmi_rate / 12 / 100;
	
	var data = amortTable(d.loan_amount, d.apr, num_payments);
	
	
	// appreciation and house value
	
	data.house_value = data.period.map(function(i) {
		return d.purchase_price * cmpInt(d.monthly_app_rate, i);
	});
	
	
	// perhaps these have backwards names
	data.inflation = data.period.map(function(i) {
		return 1 / cmpInt(d.inflation_rate_monthly, i);
	});
	data.inv_inflation = data.period.map(function(i) {
		return cmpInt(d.inflation_rate_monthly, i);
	});
	
	data.reference_line = data.period.map(function(i) {
		return downpayment * cmpInt(d.reference_rate_monthly, i);
	});
	
	data.acc_appreciation = data.period.map(function(i) {
		return d.purchase_price * (cmpInt(d.monthly_app_rate, i) - 1);
	});
	
	data.appreciation = data.period.map(function(i) {
		return d.purchase_price * (cmpInt(d.monthly_app_rate, i+1) - cmpInt(d.monthly_app_rate, i));
	});
	
	
	data.equity = data.house_value.map(function(hv, i) {
		return hv - data.loan_balance[i]; 
	});
	
	data.acc_interest = accumulate(data.interest, 0, true);
	
	data.commute_costs = data.period.map(constantValue(d.commute_costs));
	
	
	// renting as an alternative
	// TODO: factor inflation
	data.cheapest_rent = data.period.map(constantValue(d.cheapest_rent))
	//monthly_income_before_housing
	
	console.log(data);
	
	function cmpInt(periodic_rate, period) {
		// A = P(1 + r/n) ^ tn
		return Math.pow(1 + periodic_rate, period);
	}
	
	var insurance_rate = .0035;
	var insurance = d.purchase_price * insurance_rate / 12;
	data.insurance = data.period.map(constantValue(insurance));
	
	
	var overhead = d.bills_monthly + d.maint_monthly + (d.maint_yearly / 12) + d.other_fees_monthly;
	data.overhead = data.period.map(constantValue(overhead));
	
	data.property_tax = data.house_value.map(function(hv) {
		// BUG: APR or compound interest? should go off assessment
		return (d.property_tax_rate_monthly) * hv;
	});
	
	
	data.ltv = [];
	data.pmi = [];
	for(var i = 0; i <= num_payments; i++) {
		// prolly a bug here: loan balance is the ending balance
		var ltv = parseFloat((data.loan_balance[i] / d.purchase_price).toFixed(2)); 
		data.ltv[i] = ltv;
		
		// mortgage insurance
		data.pmi[i] = ltv > 0.80 ? pmi_amount : 0;
		data.payment[i] += data.pmi[i];
		
		
	}
	
	data.direct_costs = data.period.map(function(i) {
		return data.insurance[i] +
			data.pmi[i] +
			data.interest[i] +
			data.property_tax[i];
		
	});
	
	
	data.acc_direct_costs = accumulate(data.direct_costs, d.closing_costs, true);
	
	
	data.cash_spent = accumulate(sum(data.direct_costs, data.principle), d.closing_costs + downpayment, true);
	
	data.total_costs = sum(data.commute_costs, sum(data.direct_costs, data.overhead));
	
	
	data.acc_total_costs = accumulate(data.total_costs, d.closing_costs, true);
	
	data.net_gain = data.period.map(function(i) {
		return data.equity[i] + d.monthly_rental_income - downpayment - data.acc_total_costs[i];
	});
	
	
	// inflation adjustments.
	// note that some values stay constant relative to inflation
	
	
	data.inf_pmi = mul(data.pmi, data.inflation);
	data.inf_payment = mul(data.payment, data.inflation);
	data.inf_insurance = data.insurance;
	
	data.inf_house_value = mul(data.house_value, data.inflation);
	data.inf_equity = mul(data.equity, data.inflation);
	data.inf_principle = mul(data.principle, data.inflation);
	data.inf_interest = mul(data.interest, data.inflation);
	data.inf_loan_balance = mul(data.loan_balance, data.inflation);
	data.inf_reference_line = mul(data.reference_line, data.inflation);
	data.inf_overhead = data.overhead;
	data.inf_commute_costs = data.commute_costs;
	
	// can't just multiply this one like above because some part of it isn't commutative
	data.inf_acc_appreciation = data.period.map(function(i) {
		return d.purchase_price * (cmpInt(d.monthly_app_rate - d.inflation_rate_monthly, i) - 1);
	});
	
	data.inf_appreciation = data.period.map(function(i) {
		return d.purchase_price * 
			(cmpInt(d.monthly_app_rate - d.inflation_rate_monthly, i+1) - 
			cmpInt(d.monthly_app_rate - d.inflation_rate_monthly, i));
	});
	
	
	
	data.inf_direct_costs = data.period.map(function(i) {
		return data.insurance[i] +
			data.pmi[i] * data.inflation[i] + // BUG: does pmi rise?
			data.interest[i] * data.inflation[i] + // interest payments are chiseled into the contract
			data.property_tax[i];
	});
	
	data.inf_acc_interest = accumulate(data.inf_interest, 0, true);
	
	data.inf_acc_direct_costs = accumulate(data.inf_direct_costs, d.closing_costs, true);
	
	data.inf_total_costs = sum(data.inf_commute_costs, sum(data.inf_direct_costs, data.inf_overhead));
	
	data.inf_acc_total_costs = accumulate(data.inf_total_costs, d.closing_costs, true);
	
	
	data.inf_cash_spent = accumulate(sum(data.inf_direct_costs, data.inf_principle), d.closing_costs + downpayment, true);
	
	data.inf_gross_gain = data.period.map(function(i) {
		return data.inf_equity[i] - downpayment - data.inf_acc_direct_costs[i];
	});
	data.inf_net_gain = data.period.map(function(i) {
		return data.inf_equity[i] - downpayment - data.inf_acc_total_costs[i];
	});
	
	
	return {
		time_series: data,
	};
}

















