create database Luy;
use Luy;

CREATE TABLE usuario (
id INT AUTO_INCREMENT PRIMARY KEY,
login VARCHAR(100) NOT NULL,
email VARCHAR(100) NOT NULL UNIQUE,
senha CHAR(64) NOT NULL
);

CREATE TABLE paciente (
id INT AUTO_INCREMENT PRIMARY KEY,
nome VARCHAR(100) NOT NULL,
cpf VARCHAR(100) NOT NULL,
data_nascimento DATE NOT NULL
);

DELIMITER //
CREATE PROCEDURE InsertUsuario(
 IN pLogin VARCHAR(100),
 IN pEmail VARCHAR(100),
 IN pSenha VARCHAR(64)
)
BEGIN
	INSERT INTO usuario (login, email, senha)
    VALUES (pLogin, pEmail, SHA2(pSenha, 256));
END //

CREATE PROCEDURE UpdateUsuario(
	IN pId INT,
    IN pLogin VARCHAR(100),
    IN pEmail VARCHAR(100),
    IN pSenha CHAR(64),
    IN pPontuacao INT
)
BEGIN 
	UPDATE usuario
    SET login = pLogin,
    email = pEmail ,
    senha = SHA2 (pSenha, 256)
    WHERE id = pId;
END //

CREATE PROCEDURE DeleteUsuario(IN pID INT)
BEGIN
	DELETE FROM usuario WHERE id = pId;
END //

CREATE PROCEDURE SelectUsuario()
BEGIN 
	SELECT * FROM usuario;
END //

DELIMITER ;


DELIMITER //

CREATE PROCEDURE InsertPaciente(
IN pNome VARCHAR(100),
IN pCpf VARCHAR(100),
IN pData_nascimento date
)
BEGIN 
	INSERT INTO paciente (nome, cpf, data_nascimento)
    VALUES (pNome, pCpf, pData_nascimento);
END //

CREATE PROCEDURE UpdatePaciente(
	IN pNome VARCHAR(100),
    IN pCpf VARCHAR(100),
    IN pData_nascimento date
)
BEGIN 
	UPDATE paciente
    SET nome = pNome,
    cpf = pCpf,
    data_nascimento = pData_nascimento 
	WHERE  id = pId;
END //

CREATE PROCEDURE DeletePaciente(IN pId INT)
BEGIN
	DELETE FROM paciente WHERE id = pId;
END //

DELIMITER ;



