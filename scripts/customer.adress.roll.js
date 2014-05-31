var customer;
do {
    customer = db.customer.findOne({address_components: {$exists: true}});
    customer.addresses = [
        {
            address: customer.address,
            components: customer.address_components
        }
    ];
    delete customer.address_components;
    print(tojson(customer));
    db.customer.save(customer);
} while(customer);
