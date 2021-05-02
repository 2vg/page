let nav = document.querySelector('#navArea');
let btn = document.querySelector('.toggle_btn');
let sub_mask = document.querySelector('#sub-mask');
let inner = document.querySelector('#nav .inner');
let main_mask = document.querySelector('#main #main-mask');
let open = 'open';

btn.addEventListener('click', event => {
	if (nav.classList.contains(open)) {
        nav.classList.add('hide');
        //main_mask.style.display = "none";
        nav.classList.remove(open);
        main.classList.remove(open);
        setTimeout(() => {
            if (nav.classList.contains('show')) {
                nav.classList.remove('show');
            };
        }, 500);
    } else {
        if (nav.classList.contains('hide')) {
            nav.classList.remove('hide');
        };
        nav.classList.add('show');
        //main_mask.style.display = "block";
        nav.classList.add(open);
        main.classList.add(open);
    };
});

sub_mask.addEventListener('click', event => {
    nav.classList.remove(open);
});
