document.getElementById('addBookForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    const title = document.getElementById('title').value;
    const author = document.getElementById('author').value;
    const isbn = document.getElementById('isbn').value;
    
    
    const response = await fetch('/api/books', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title, author, isbn })
    });

    const data = await response.json();
    alert('Book added successfully');
    getBooks(); 
});

async function getBooks() {
    const response = await fetch('/api/books');
    const data = await response.json();
    const booksList = document.getElementById('booksList');
    booksList.innerHTML = '';
    data.forEach(book => {
        const li = document.createElement('li');
        li.textContent = `Title: ${book.title}, Author: ${book.author}, ISBN: ${book.isbn}`;
        
const deleteButton = document.createElement('button');
deleteButton.textContent = 'Delete';
deleteButton.onclick = async () => {
const deleteResponse = await fetch(`/api/books/${book.id}`, {
method: 'DELETE'
});
const deleteData = await deleteResponse.json();
if (deleteData.message === 'Book deleted successfully') {
alert('Book deleted successfully');
getBooks(); 
} else {
alert('Failed to delete book: ' + deleteData.message);
}
};
li.appendChild(deleteButton);

        const updateButton = document.createElement('button');
        updateButton.textContent = 'Update';
        updateButton.onclick = async () => {
            const updatedTitle = prompt('Enter updated title:', book.title);
            const updatedAuthor = prompt('Enter updated author:', book.author);
            const updatedISBN = prompt('Enter updated ISBN:', book.isbn);
            const updateResponse = await fetch(`/api/books/${book.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title: updatedTitle, author: updatedAuthor, isbn: updatedISBN })
            });
            alert('Book updated successfully');
            getBooks(); 
        };
        li.appendChild(updateButton);

        
        const borrowButton = document.createElement('button');
        borrowButton.textContent = 'Borrow';
        borrowButton.onclick = async () => {
        const userId = prompt('Enter your user ID:');
        const borrowResponse = await fetch('/api/borrow', {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json'
    },
body: JSON.stringify({ user_id: userId, book_id: book.id })
});
const borrowData = await borrowResponse.json();
if (borrowData.message === 'Book borrowed successfully') {
alert('Book borrowed successfully');
getBorrowings(); 
} else {
alert('Failed to borrow book: ' + borrowData.message);
}
};
li.appendChild(borrowButton);
        booksList.appendChild(li);
    });
}

async function getBorrowings() {
const response = await fetch('/api/borrowings');
const data = await response.json();
const borrowingList = document.getElementById('borrowingList');
borrowingList.innerHTML = '';
data.forEach(borrowing => {
const li = document.createElement('li');
li.textContent = `User ID: ${borrowing.user_id}, Book ID: ${borrowing.book_id}, Borrowed At: ${new Date(borrowing.borrowed_at).toLocaleString()}, Returned At: ${borrowing.returned_at ? new Date(borrowing.returned_at).toLocaleString() : 'Not Returned'}`;

const buttonContainer = document.createElement('div');

if (!borrowing.returned_at) {
    const returnButton = document.createElement('button');
    returnButton.textContent = 'Return';
    returnButton.onclick = async () => {
        const returnResponse = await fetch(`/api/return/${borrowing.id}`, {
            method: 'PUT'
        });
        const returnData = await returnResponse.json();
        if (returnData.message === 'Book returned successfully') {
            alert('Book returned successfully');
            getBorrowings(); 
        } else {
            alert('Failed to return book: ' + returnData.message);
        }
    };
    buttonContainer.appendChild(returnButton);
}

li.appendChild(buttonContainer);

borrowingList.appendChild(li);
});
}


getBooks();
getBorrowings();