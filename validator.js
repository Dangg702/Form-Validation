const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);


function Validator(options) {

    // hàm getParent giúp lấy ra đúng phần tử cha của phần tử (selector) được truyền vào
    function getParent(element, selector){
        // lặp đến khi gặp phần tử cha có tên class trùng vs selector
        while(element.parentElement){
            if(element.parentElement.matches(selector)){
                return element.parentElement;
            }
            element = element.parentElement;
        }
    }

    // kho lưu lại các rule của mỗi selector --> giúp mỗi trường có thể có nhiều rule mà k bị ghi đè
    var selectorRules = {};

    // hàm thực hiện validate
    function validate(inputElement, rule, options, isTyping){
        // var errorElement = inputElement.parentElement.querySelector(options.errorMessage);

        var errorElement = getParent(inputElement, options.formGroupSelector).querySelector(options.errorSelector);

        // var errorMessage = rule.test(inputElement.value, isTyping);
        var errorMessage;

        // lấy ra các rules của selector
        var rules = selectorRules[rule.selector];

        // lặp qua từng rule và kiểm tra
        // Nếu có lỗi thì dừng việc kiểm tra
        for (var i = 0; i < rules.length; ++i) {
            switch(inputElement.type){
                case 'radio':
                case 'checkbox':
                    errorMessage = rules[i](
                        formElement.querySelector(rule.selector + ':checked'), isTyping
                        );
                    break;
                default:
                    errorMessage = rules[i](inputElement.value, isTyping);
            }

            if(errorMessage) break;
        }

        if(errorMessage){
            errorElement.innerText = errorMessage;
            getParent(inputElement, options.formGroupSelector).classList.add('invalid');
        }else {
            errorElement.innerText = "";
            getParent(inputElement, options.formGroupSelector).classList.remove('invalid');
        }

        return !errorMessage; //convert to boolean
    }

    // lấy element của form cần validate
    var formElement = $(options.form);
    if(formElement){
        // khi submit form
        formElement.onsubmit = function(e){
            // loại bỏ hành vi submit mặc định
            e.preventDefault();

            var isFormValid = true;

            // lặp qua từng rule và validate
            options.rules.forEach(rule => {
                var inputElement = formElement.querySelector(rule.selector);
               
                var isValid = validate(inputElement, rule, options, false);
                if(!isValid){
                    isFormValid = false;
                }
            });

            // nếu không có lỗi --> in ra DL nhập từ form
            if(isFormValid){
                // Trường hợp submit với JS
                if(typeof options.onSubmit == 'function'){
                    // lấy ra tất cả các input có field name và không bị disabled
                    // enableInputs trả về 1 NodeList
                    var enableInputs = formElement.querySelectorAll('[name]:not([disabled]');
                    
                    // convert NodeList thành Array
                    var formValues = Array.from(enableInputs).reduce((values, input)=> {
                        switch(input.type){
                            case 'radio':
                                if(input.checked){
                                    values[input.name] = input.value;
                                }
                                if(!values[input.name]){
                                    values[input.name] = '';
                                }
                                break;
                            case 'checkbox':
                                // Nếu input field không đc checked --> trả về values
                                if(!input.checked){return values}
                                // Nếu input field đc checked 
                                // --> Nếu đến options cuối vẫn chưa được checked thì gán cho value = chuỗi rỗng
                                if(!values[input.name]){
                                    values[input.name] = '';
                                }
                                // --> KT nếu values k phải array --> gán cho mảng rỗng
                                // --> Nếu là mảng --> push giá trị của input vào mảng
                                if(!Array.isArray(values[input.name])){
                                    values[input.name] = [];
                                }
                                values[input.name].push(input.value);


                                // if(input.checked){
                                //     // KT mảng values[input.name] có tồn tại hay không
                                //     // Nếu có thì push giá trị của input vào mảng
                                //     // Nếu không thì tạo mảng mới và gán giá trị của input vào mảng
                                //     if(Array.isArray(values[input.name])){
                                //         values[input.name].push(input.value);
                                //     }else {
                                //         values[input.name] = [input.value];
                                //     }
                                // }
                                // // Kiểm tra xem values[input.name] nếu không có gì thì thì gán cho chuỗi rỗng
                                // if(!values[input.name]){
                                //     values[input.name] = '';
                                // }
                                break;
                            case 'file':
                                // TH là file thì không thể lấy input.value đc vì nó sẽ trả về 1 fake path --> không thể sd
                                //  --> sd input.file để lấy value(path)
                                values[input.name] = input.files;
                                break;
                            default:
                                values[input.name] = input.value;
                        }
                        return values;
                    }, {});

                    options.onSubmit(formValues);
                }else{
                    // Trường hợp submit với hành vi mặc định
                    formElement.submit();
                }
            }
        }

        options.rules.forEach(rule => {
            // lưu lại các rules cho mỗi input
            if(Array.isArray(selectorRules[rule.selector])){
                // từ lần thứ 2 trở đi lưu giá trị rule vào mảng selectorRules[rule.selector]
                selectorRules[rule.selector].push(rule.test);
            }else {
                // lúc đầu tiên giá trị trả về là undefined --> gán giá trị mảng có 1 phần tử là test
                selectorRules[rule.selector] = [rule.test];
            }

            // không dùng document.querySelector vì nó có thể gây nhầm lẫn khi có nhiều form
            // formElement.querySelector giúp lấy ra đúng phần tử trong form chỉ định
            var inputElements = formElement.querySelectorAll(rule.selector);

            // Convert NodeList --> Array
            Array.from(inputElements).forEach(inputElement => {
                // xử lý trường hợp blur khỏi input
                inputElement.onblur = function(){
                    validate(inputElement, rule, options, false);
                }

                // xử lý loại bỏ thông báo lỗi khi người dùng đang nhập liệu
                inputElement.oninput = function(){
                    validate(inputElement, rule, options, true);
                }
            });  
        });
    }
}

// Định nghĩa Rules
// Nguyên tắc của các rules:
// 1. Khi có lỗi => trả ra message lỗi
// 2. Khi hợp lệ => trả về undefined
Validator.isRequired = (selector, message) => {
    return {
        selector,
        test: function(value, isTyping){
            return (value || isTyping == true) ? undefined : message || "This field is required";
        }
    }
}

Validator.isEmail = (selector, message) => {
    return {
        selector,
        test: function(value, isTyping){
            var regex = /^[a-z][a-z0-9_\.]{5,32}@[a-z0-9]{2,}(\.[a-z0-9]{2,4}){1,2}$/;
            return (regex.test(value) || isTyping == true) ? undefined : message || "This field must be email";
        }
    }
}

Validator.minLength = (selector, min, message) => {
    return {
        selector,
        test: function(value, isTyping){
            var regex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{6,}$/;
            if (value.length >= min || regex.test(value) && isTyping == true){
                return undefined;
            }
            return message || `This field must be greater than ${min} characters and contain at least one uppercase letter, one lowercase letter, one number`;
        }
    }
}

Validator.isConfirmed = (selector, getConfirmValue, message) => {
    return {
        selector,
        test: function(value, isTyping){
            return (value === getConfirmValue() || isTyping == true) ? undefined : message || "Input value does not match";
        }

    }
}
