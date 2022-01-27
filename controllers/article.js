'use strict'

var validator = require('validator');
var fs = require('fs');
var path = require('path');

var Article = require('../models/article')

var controller = {
    datosCurso: (req, res) => {
        var params = req.body.hola;
        return res.status(200).send({
            curso: 'Máster en Frameworks JS',
            autor: 'Víctor Robles WEB',
            url: 'victorroblesweb.es',
            params
        });
    },

    test: (req, res) => {
        return res.status(200).send({
            message: 'Soy la acción test de mi controlador de artículos'
        });
    },

    save: (req, res) => {
        //Recoger por Post
        var params = req.body;

        //Validar datos(Vaidator)
        try {
            var validate_title = !validator.isEmpty(params.title);
            var validate_content = !validator.isEmpty(params.content);
        } catch (error) {
            return res.status(200).send({
                status: 'error',
                message: 'Faltan datos por enviar'
            });
        }

        if (validate_title && validate_content) {

            //Crear el objeto a guardar
            var article = new Article();

            //Asignar valores
            article.title = params.title;
            article.content = params.content;
            article.image = null;

            //Guardar el artículo
            article.save((err, articleStored) => {
                if (err || !articleStored) {
                    return res.status(404).send({
                        status: 'error',
                        message: 'El artículo no se ha guardado'
                    });
                }
                //Devolver respuesta
                return res.status(200).send({
                    status: 'success',
                    article
                });
            });
        } else {

            return res.status(200).send({
                status: 'error',
                message: 'Los datos no son válidos'
            });
        }

    },
    getArticles: (req, res) => {

        var query = Article.find({});

        var last = req.params.last;
        if (last || last != undefined) {
            query.limit(5);
        }
        //Find
        query.sort('-_id').exec((err, articles) => {
            if (err) {
                return res.status(500).send({
                    status: 'error',
                    message: 'Error al devolver los datos'
                });
            }
            if (!articles) {
                return res.status(404).send({
                    status: 'error',
                    message: 'No hay artículos para mostrar'
                });
            }
            return res.status(200).send({
                status: 'success',
                articles
            });
        });
    },
    getArticle: (req, res) => {
        //Recoger id de url
        var articleId = req.params.id;
        //Comprobar que existe
        if (!articleId || articleId == null) {
            return res.status(404).send({
                status: 'error',
                message: 'No existe el artículo'
            });
        }

        //Buscar el artículo
        Article.findById(articleId, (err, article) => {
            if (err) {
                return res.status(500).send({
                    status: 'error',
                    message: 'Error al devolver los datos'
                });
            }
            if (!article) {
                return res.status(404).send({
                    status: 'error',
                    message: 'No existe el artículo'
                });
            }
            //Devolver json
            return res.status(200).send({
                status: 'success',
                article
            });
        });
    },
    update: (req, res) => {

        //Recoger el id del articulo por la URL
        var articleId = req.params.id;

        //Recoger los datos que llegan por PUT
        var params = req.body;

        //Validar los datos
        try {
            var validate_title = !validator.isEmpty(params.title);
            var validate_content = !validator.isEmpty(params.content);
        } catch (err) {
            return res.status(404).send({
                status: 'error',
                message: 'Faltan datos por enviar'
            });
        }

        if (validate_title && validate_content) {
            //Find and update
            Article.findOneAndUpdate({ _id: articleId }, params, { new: true }, (err, articleUpdated) => {
                if (err) {
                    return res.status(500).send({
                        status: 'error',
                        message: 'Error al actualizar'
                    });
                }
                if (!articleUpdated) {
                    return res.status(404).send({
                        status: 'error',
                        message: 'No existe el artículo'
                    });
                }
                //Devolver respuesta
                return res.status(200).send({
                    status: 'success',
                    articleUpdated
                });
            });
        } else {
            return res.status(200).send({
                status: 'error',
                message: 'La validación no es correcta'
            });
        }
    },

    delete: (req, res) => {
        //Recoger el id de la url
        var articleId = req.params.id;

        //Find and delete
        Article.findOneAndDelete({ _id: articleId }, (err, articleRemoved) => {
            if (err) {
                return res.status(500).send({
                    status: 'error',
                    message: 'Error al actualizar'
                });
            }

            if (!articleRemoved) {
                return res.status(404).send({
                    status: 'error',
                    message: 'No se ha borrado el artículo, posiblemente no exista!!!'
                });
            }
            //Devolver respuesta
            return res.status(200).send({
                status: 'success',
                articleRemoved
            });
        });
    },

    upload: (req, res) => {
        //Configurar el módulo del connect multiparty router/article.js(hecho)
        //Recoger el fichero de la petición
        var file_name = 'imagen no subida';

        if (!req.files.file0 || req.files.file0 == 'undefined' || req.files.file0 == null) {
            console.log(file_name);
            return res.status(404).send({
                status: 'error',
                file_name
            });
        }

        //Conseguir el nombre y la extensión del archivo
        var file_path = req.files.file0.path;
        var file_split = file_path.split('\\');

        var file_name = file_split[2];

        //Comprobar la extensión, sólo imágenes, si no es válida, borrar el fichero

        var extension_split = file_name.split('\.');
        var file_ext = extension_split[1];

        if (file_ext != 'png' && file_ext != 'jpg' && file_ext != 'jpeg' && file_ext != 'gif') {
            //Borrar el archivo
            fs.unlink(file_path, (err) => {
                return res.status(404).send({
                    status: 'error',
                    message: 'La extensión de la imagen no es válida',
                    file_ext
                });
            });
        } else {
            var articleId = req.params.id;


            //Buscar el artículo, asignar nombre  a la imagen y actualizarlo
            var old_image = '';

            Article.findById(articleId, (err, article) => {
                if (err) {

                }
                if (article) {
                    old_image = article.image;
                }

            });


            Article.findOneAndUpdate({ _id: articleId }, { image: file_name }, { new: true }, (err, articleUpdated) => {
                if (err || !articleUpdated) {
                    return res.status(404).send({
                        status: 'error',
                        message: 'error al guardar la imagen del artículo'
                    });
                } else {
                    fs.unlink('upload/articles/' + old_image, (err) => {
                        if (err) {
                            console.log(err);
                        }
                        return res.status(200).send({
                            status: 'success',
                            article: articleUpdated,
                            old_image
                        });
                    });
                }
            });
        }
    },

    delete_img: (req, res) => {
        var old_image = req.params.path;
        fs.unlink('upload/articles/' + old_image, (err) => {
            if (err) {
                console.log(err);
                return res.status(404).send({
                    status: 'error',
                    message: 'imagen no borrada'
                });
            }
            return res.status(200).send({
                status: 'success',
                message: old_image + ' eliminado'
            });
        });

    },

    getImage: (req, res) => {
        var file = req.params.image;
        var path_file = './upload/articles/' + file;

        fs.exists(path_file, (exists) => {
            if (exists) {
                return res.sendFile(path.resolve(path_file));
            } else {
                return res.status(404).send({
                    status: 'error',
                    message: 'La imagen no existe'
                });
            }
        });
    },

    search: (req, res) => {
        //Sacar el string a buscar
        var searchString = req.params.search;

        //Find or
        Article.find({
            "$or": [
                {
                    "title": { "$regex": searchString, "$options": "i" }
                }, {
                    "content": { "$regex": searchString, "$options": "i" }
                }
            ]
        })
            .sort([['date', 'descending']])
            .exec((err, articles) => {
                if (err) {
                    return res.status(500).send({
                        status: 'error',
                        message: 'Error en la petición'
                    });
                }
                if (!articles || articles.length <= 0) {
                    return res.status(404).send({
                        status: 'error',
                        message: 'No hay artículos que coincidan con tu búsqueda'
                    });
                } else {
                    return res.status(200).send({
                        status: 'success',
                        articles
                    });
                }

            });

    }
};

module.exports = controller;