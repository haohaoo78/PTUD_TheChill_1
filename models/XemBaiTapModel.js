// models/Assignment.js
const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // file kết nối MySQL của bạn

const Assignment = sequelize.define('Assignment', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    subject: {
        type: DataTypes.STRING,
        allowNull: false
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    assignDate: {
        type: DataTypes.STRING,
        allowNull: false
    },
    dueDate: {
        type: DataTypes.STRING,
        allowNull: false
    },
    expired: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    remainingDays: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    fileUrl: {
        type: DataTypes.STRING,
        defaultValue: ''
    },
    fileName: {
        type: DataTypes.STRING,
        defaultValue: ''
    },
    teacherId: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'assignments',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
});

module.exports = Assignment;